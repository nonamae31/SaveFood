using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Hubs;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Common.Exceptions;
using SaveFoodBackend.Services;

namespace SaveFoodBackend.Application.Orders.Commands;

public record CheckoutCommand(Guid UserId, CheckoutRequestDTO Request) : IRequest<CheckoutResponseDTO>;

public class CheckoutCommandHandler : IRequestHandler<CheckoutCommand, CheckoutResponseDTO>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IPayOSService _payOSService;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _unitOfWork;

    public CheckoutCommandHandler(SaveFoodDbContext ctx, IPayOSService payOSService, INotificationService notificationService, IUnitOfWork unitOfWork)
    {
        _ctx = ctx;
        _payOSService = payOSService;
        _notificationService = notificationService;
        _unitOfWork = unitOfWork;
    }

    private string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    public async Task<CheckoutResponseDTO> Handle(CheckoutCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;
        var userId = request.UserId;

        if (!req.AgreedToNoRefundPolicy)
            throw new BusinessException("Bạn phải đồng ý với chính sách không hoàn tiền nếu không đến lấy hàng.");

        if (req.CartItemIds == null || !req.CartItemIds.Any())
            throw new BusinessException("Giỏ hàng trống hoặc chưa chọn sản phẩm.");

        if (req.PaymentMethod != 0 && req.PaymentMethod != 1)
            throw new BusinessException("Phương thức thanh toán không hợp lệ.");

        var createdOrders = new List<Order>();
        var firstOrderId = Guid.Empty;
        string firstPickupCode = "";
        string? checkoutUrl = null;
        bool isFullyPaidByVoucher = false;

        // START TRANSACTION (Wrapped in ExecutionStrategy for Retry support)
        var strategy = _ctx.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var cartItems = await _ctx.CartItems
                    .Include(ci => ci.Listing)
                        .ThenInclude(l => l.Product)
                            .ThenInclude(p => p.Store)
                    .Where(ci => req.CartItemIds.Contains(ci.Id) && ci.Cart.UserId == userId)
                    .ToListAsync(cancellationToken);

                if (cartItems.Count != req.CartItemIds.Count)
                    throw new BusinessException("Một hoặc nhiều sản phẩm đã thay đổi hoặc không còn trong giỏ hàng. Vui lòng tải lại giỏ hàng và thử lại.");

                long orderCode = long.Parse(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString());

                decimal totalCheckoutAmount = cartItems.Sum(ci => ci.Listing.SalePrice * ci.Quantity);
                CustomerWallet? customerWallet = null;
                
                var fundInfo = await _ctx.CustomerVoucherFunds.Where(v => v.CustomerId == userId).Select(v => new { v.Id, v.AccumulatedBalance, v.ReservedAmount }).FirstOrDefaultAsync(cancellationToken);
                Guid? customerVoucherFundId = fundInfo?.Id;
                decimal remainingVoucher = 0;

                if (req.ApplyVoucherAmount.HasValue && req.ApplyVoucherAmount.Value > 0)
                {
                    if (fundInfo == null)
                        throw new BusinessException("Không tìm thấy quỹ voucher.");

                    decimal availableVoucher = fundInfo.AccumulatedBalance - fundInfo.ReservedAmount;
                    if (req.ApplyVoucherAmount.Value > availableVoucher)
                        throw new BusinessException("Số tiền voucher áp dụng vượt quá số dư khả dụng.");

                    if (req.ApplyVoucherAmount.Value > totalCheckoutAmount)
                        throw new BusinessException("Số tiền voucher áp dụng không được vượt quá tổng giá trị đơn hàng.");

                    remainingVoucher = req.ApplyVoucherAmount.Value;
                }

                decimal grandTotalAmount = 0; // Total after voucher

                if (req.PaymentMethod == 0 && (totalCheckoutAmount - remainingVoucher) > 0) // Wallet
                {
                    customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);
                    if (customerWallet == null || customerWallet.Balance < (totalCheckoutAmount - remainingVoucher))
                    {
                        throw new BusinessException("Số dư trong Ví SaveFood không đủ để thanh toán.");
                    }
                }
                
                var storeGroups = cartItems.GroupBy(ci => ci.Listing.Product.StoreId).ToList();
                createdOrders.Clear();
                firstOrderId = Guid.Empty;
                firstPickupCode = "";

                foreach (var group in storeGroups)
                {
                    var storeId = group.Key;
                    var storeItems = group.ToList();

                    decimal storeTotalAmount = 0;
                    foreach (var item in storeItems)
                    {
                        if (item.Listing.Product.Store.Status != (byte)SaveFoodBackend.Models.Enums.StoreStatus.Active)
                            throw new BusinessException($"Cửa hàng '{item.Listing.Product.Store.Name}' hiện đang tạm nghỉ, không thể thanh toán.");

                        if (item.Listing.ExpiryDate <= DateTime.UtcNow)
                            throw new BusinessException($"Sản phẩm '{item.Listing.Title}' đã hết hạn.");

                        storeTotalAmount += item.Listing.SalePrice * item.Quantity;
                    }

                    decimal discountForThisOrder = Math.Min(storeTotalAmount, remainingVoucher);
                    remainingVoucher -= discountForThisOrder;
                    grandTotalAmount += (storeTotalAmount - discountForThisOrder);

                    string pickupCode = GenerateRandomCode(6);

                    var now = DateTime.UtcNow;
                    var localNow = TimeZoneInfo.ConvertTimeFromUtc(now, TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"));
                    var localEndOfDay = new DateTime(localNow.Year, localNow.Month, localNow.Day, 23, 59, 59);
                    var utcEndOfDay = TimeZoneInfo.ConvertTimeToUtc(localEndOfDay, TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"));

                    var minExpiryDate = storeItems.Min(ci => ci.Listing.ExpiryDate);
                    var maxPickupTime = minExpiryDate < utcEndOfDay ? minExpiryDate : utcEndOfDay;

                    var order = new Order
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        StoreId = storeId,
                        TotalAmount = storeTotalAmount,
                        VoucherDiscount = discountForThisOrder,
                        OrderStatus = OrderStatusEnum.Pending,
                        PickupCode = pickupCode,
                        OrderCode = orderCode,
                        ReservationExpiresAt = DateTime.UtcNow.AddMinutes(10),
                        ExpectedPickupTime = req.ExpectedPickupTime,
                        MaxPickupTime = maxPickupTime,
                        AgreedToNoRefundPolicy = req.AgreedToNoRefundPolicy
                    };

                    if (firstOrderId == Guid.Empty)
                    {
                        firstOrderId = order.Id;
                        firstPickupCode = pickupCode;
                    }

                    foreach (var item in storeItems)
                    {
                        var rowsAffected = await _ctx.ClearanceListings
                            .Where(l => l.Id == item.ListingId && l.QuantityAvailable >= item.Quantity)
                            .ExecuteUpdateAsync(s => s.SetProperty(l => l.QuantityAvailable, l => l.QuantityAvailable - item.Quantity), cancellationToken);

                        if (rowsAffected == 0)
                            throw new BusinessException($"Sản phẩm '{item.Listing.Title}' không đủ số lượng trong kho hoặc đã có người khác đặt mua.");

                        order.OrderItems.Add(new OrderItem
                        {
                            Id = Guid.NewGuid(),
                            OrderId = order.Id,
                            ListingId = item.ListingId,
                            Quantity = item.Quantity,
                            UnitPriceSnapshot = item.Listing.SalePrice,
                            ProductNameSnapshot = item.Listing.Title
                        });
                    }

                    _ctx.Orders.Add(order);
                    createdOrders.Add(order);

                    var payment = new Payment
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        Amount = storeTotalAmount - discountForThisOrder,
                        PaymentMethod = req.PaymentMethod,
                        Status = 0 // Pending
                    };
                    _ctx.Payments.Add(payment);
                }

                _ctx.CartItems.RemoveRange(cartItems);

                if (req.ApplyVoucherAmount.HasValue && req.ApplyVoucherAmount.Value > 0 && customerVoucherFundId.HasValue)
                {
                    int updated = await _ctx.CustomerVoucherFunds
                        .Where(v => v.Id == customerVoucherFundId.Value && (v.AccumulatedBalance - v.ReservedAmount) >= req.ApplyVoucherAmount.Value)
                        .ExecuteUpdateAsync(s => s.SetProperty(v => v.ReservedAmount, v => v.ReservedAmount + req.ApplyVoucherAmount.Value), cancellationToken);

                    if (updated == 0)
                        throw new BusinessException("Số dư voucher đã thay đổi. Vui lòng thử lại.");
                }

                if (grandTotalAmount == 0)
                {
                    // Fully paid by voucher (0 VND)
                    foreach (var order in createdOrders)
                    {
                        order.OrderStatus = OrderStatusEnum.Pending; // Wait for store confirmation
                        order.ReservationExpiresAt = null; // Paid
                        var payment = order.Payment;
                        if (payment != null) payment.Status = 1; // Paid
                        
                        if (order.VoucherDiscount > 0 && customerVoucherFundId.HasValue)
                        {
                            await _ctx.CustomerVoucherFunds
                                .Where(v => v.Id == customerVoucherFundId.Value)
                                .ExecuteUpdateAsync(s => s
                                    .SetProperty(v => v.AccumulatedBalance, v => v.AccumulatedBalance - order.VoucherDiscount)
                                    .SetProperty(v => v.ReservedAmount, v => v.ReservedAmount - order.VoucherDiscount), cancellationToken);

                            var customerTransaction = new CustomerVoucherTransaction
                            {
                                Id = Guid.NewGuid(),
                                CustomerVoucherFundId = customerVoucherFundId.Value,
                                OrderId = order.Id,
                                Amount = -order.VoucherDiscount, // Âm
                                OrderTotal = order.TotalAmount,
                                Type = 2, // Used
                                CreatedAt = DateTime.UtcNow
                            };
                            _ctx.CustomerVoucherTransactions.Add(customerTransaction);
                        }

                        // Increment Store Wallet PendingBalance
                        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, cancellationToken);
                        if (storeWallet == null)
                        {
                            storeWallet = new StoreWallet
                            {
                                Id = Guid.NewGuid(),
                                StoreId = order.StoreId,
                                AvailableBalance = 0,
                                PendingBalance = 0,
                                UpdatedAt = DateTime.UtcNow
                            };
                            _ctx.StoreWallets.Add(storeWallet);
                        }
                        
                        // Default admin fee 5% based on original TotalAmount
                        decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
                        storeWallet.PendingBalance += (order.TotalAmount - platformFee);
                    }
                    if (grandTotalAmount == 0)
                    {
                        isFullyPaidByVoucher = true;
                    }
                }
                else if (req.PaymentMethod == 1) // PayOS
                {
                    try
                    {
                        var payOSResult = await _payOSService.CreatePaymentLink(orderCode, grandTotalAmount, $"DH {orderCode}", orderCode.ToString(), req.ReturnUrl, req.CancelUrl);
                        checkoutUrl = payOSResult.CheckoutUrl;
                    }
                    catch (Exception ex)
                    {
                        throw new BusinessException("Lỗi khi tạo link thanh toán PayOS: " + ex.Message);
                    }
                }
                else if (req.PaymentMethod == 0) // Wallet
                {
                    if (customerWallet == null) 
                        throw new BusinessException("Lỗi hệ thống: Không tìm thấy ví khách hàng.");
                    
                    customerWallet.Balance -= grandTotalAmount;
                    
                    foreach (var order in createdOrders)
                    {
                        order.OrderStatus = OrderStatusEnum.Pending; // Wait for store confirmation
                        order.ReservationExpiresAt = null; // Paid, so remove the 10-minute timeout
                        var payment = order.Payment;
                        if (payment != null) payment.Status = 1; // Paid
                        
                        var customerTransaction = new CustomerWalletTransaction
                        {
                            Id = Guid.NewGuid(),
                            CustomerWalletId = customerWallet.Id,
                            OrderId = order.Id,
                            Amount = order.TotalAmount - order.VoucherDiscount, // Âm
                            Type = 2, // Payment
                            Status = 1, // Completed
                            Description = $"Thanh toán đơn hàng {order.OrderCode}",
                            CreatedAt = DateTime.UtcNow
                        };
                        _ctx.CustomerWalletTransactions.Add(customerTransaction);

                        if (order.VoucherDiscount > 0 && customerVoucherFundId.HasValue)
                        {
                            await _ctx.CustomerVoucherFunds
                                .Where(v => v.Id == customerVoucherFundId.Value)
                                .ExecuteUpdateAsync(s => s
                                    .SetProperty(v => v.AccumulatedBalance, v => v.AccumulatedBalance - order.VoucherDiscount)
                                    .SetProperty(v => v.ReservedAmount, v => v.ReservedAmount - order.VoucherDiscount), cancellationToken);

                            var voucherTransaction = new CustomerVoucherTransaction
                            {
                                Id = Guid.NewGuid(),
                                CustomerVoucherFundId = customerVoucherFundId.Value,
                                OrderId = order.Id,
                                Amount = -order.VoucherDiscount, // Âm
                                OrderTotal = order.TotalAmount,
                                Type = 2, // Used
                                CreatedAt = DateTime.UtcNow
                            };
                            _ctx.CustomerVoucherTransactions.Add(voucherTransaction);
                        }

                        // Increment Store Wallet PendingBalance
                        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, cancellationToken);
                        if (storeWallet == null)
                        {
                            storeWallet = new StoreWallet
                            {
                                Id = Guid.NewGuid(),
                                StoreId = order.StoreId,
                                AvailableBalance = 0,
                                PendingBalance = 0,
                                UpdatedAt = DateTime.UtcNow
                            };
                            _ctx.StoreWallets.Add(storeWallet);
                        }
                        
                        // Default admin fee 5%
                        decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
                        storeWallet.PendingBalance += (order.TotalAmount - platformFee);
                    }
                }

                await _unitOfWork.CommitTransactionAsync(cancellationToken);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        });

        // Notifications
        if (req.PaymentMethod == 0 || isFullyPaidByVoucher) // Only notify immediately if Wallet or 0 VND
        {
            foreach (var order in createdOrders)
            {
                var staffIds = await _ctx.StoreStaffs
                    .Where(s => s.StoreId == order.StoreId)
                    .Select(s => s.UserId)
                    .ToListAsync(cancellationToken);

                foreach (var uid in staffIds.Distinct())
                {
                    await _notificationService.SendAsync(
                        userId: uid,
                        title: "Đơn hàng mới",
                        body: $"Có đơn hàng mới ({order.OrderCode}) vừa được thanh toán. Vui lòng kiểm tra và chuẩn bị món!",
                        type: "NEW_ORDER",
                        referenceId: order.Id
                    );
                }
            }
        }

        return new CheckoutResponseDTO
        {
            OrderId = firstOrderId,
            CheckoutUrl = checkoutUrl,
            PickupCode = (req.PaymentMethod == 0 || isFullyPaidByVoucher) ? firstPickupCode : null,
            ReservationExpiresAt = createdOrders.FirstOrDefault()?.ReservationExpiresAt
        };
    }
}
