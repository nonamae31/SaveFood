using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Hubs;

namespace SaveFoodBackend.Services;

public class OrderService : IOrderService
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IPayOSService _payOSService;
    private readonly IHubContext<NotificationHub> _hubContext;

    public OrderService(SaveFoodDbContext ctx, IPayOSService payOSService, IHubContext<NotificationHub> hubContext)
    {
        _ctx = ctx;
        _payOSService = payOSService;
        _hubContext = hubContext;
    }

    public async Task<CheckoutResponseDTO> CheckoutAsync(Guid userId, CheckoutRequestDTO req, CancellationToken ct = default)
    {
        if (!req.AgreedToNoRefundPolicy)
            throw new Exception("Bạn phải đồng ý với chính sách không hoàn tiền nếu không đến lấy hàng.");

        if (req.CartItemIds == null || !req.CartItemIds.Any())
            throw new Exception("Giỏ hàng trống hoặc chưa chọn sản phẩm.");

        var cartItems = await _ctx.CartItems
            .Include(ci => ci.Listing)
                .ThenInclude(l => l.Product)
            .Where(ci => req.CartItemIds.Contains(ci.Id) && ci.Cart.UserId == userId)
            .ToListAsync(ct);

        if (cartItems.Count != req.CartItemIds.Count)
            throw new Exception("Có sản phẩm không hợp lệ trong giỏ hàng.");

        if (req.PaymentMethod != 1)
            throw new Exception("Chỉ hỗ trợ thanh toán online qua PayOS.");

        var storeIds = cartItems.Select(ci => ci.Listing.Product.StoreId).Distinct().ToList();
        if (storeIds.Count > 1)
            throw new Exception("Chỉ được thanh toán các sản phẩm của cùng 1 cửa hàng trong 1 lần thanh toán.");

        var storeId = storeIds.First();

        decimal totalAmount = 0;
        foreach (var item in cartItems)
        {
            if (item.Listing.ExpiryDate <= DateTime.UtcNow)
                throw new Exception($"Sản phẩm '{item.Listing.Title}' đã hết hạn.");

            totalAmount += item.Listing.SalePrice * item.Quantity;
        }

        // Generate Codes
        string pickupCode = GenerateRandomCode(6);
        long orderCode = long.Parse(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString());

        // Calculate MaxPickupTime (min of EndOfDay or Earliest ExpiryDate)
        var now = DateTime.UtcNow;
        // In Vietnam Time, "End of Today" would be today at 23:59:59 local, but for simplicity let's use +14 hours or similar.
        // Actually, since ExpiryDate is stored in UTC, we can just take End Of UTC Day + 7 hours, or just take the exact UTC representation of end of day local.
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(now, TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"));
        var localEndOfDay = new DateTime(localNow.Year, localNow.Month, localNow.Day, 23, 59, 59);
        var utcEndOfDay = TimeZoneInfo.ConvertTimeToUtc(localEndOfDay, TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"));

        var minExpiryDate = cartItems.Min(ci => ci.Listing.ExpiryDate);
        var maxPickupTime = minExpiryDate < utcEndOfDay ? minExpiryDate : utcEndOfDay;

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StoreId = storeId,
            TotalAmount = totalAmount,
            OrderStatus = 0, // PendingPayment (assuming 0 is Pending)
            PickupCode = pickupCode,
            OrderCode = orderCode,
            ReservationExpiresAt = DateTime.UtcNow.AddMinutes(10),
            ExpectedPickupTime = req.ExpectedPickupTime,
            MaxPickupTime = maxPickupTime,
            AgreedToNoRefundPolicy = req.AgreedToNoRefundPolicy
        };

        foreach (var item in cartItems)
        {
            // Deduct stock atomically
            var rowsAffected = await _ctx.ClearanceListings
                .Where(l => l.Id == item.ListingId && l.QuantityAvailable >= item.Quantity)
                .ExecuteUpdateAsync(s => s.SetProperty(l => l.QuantityAvailable, l => l.QuantityAvailable - item.Quantity), ct);

            if (rowsAffected == 0)
                throw new Exception($"Sản phẩm '{item.Listing.Title}' không đủ số lượng trong kho hoặc đã có người khác đặt mua.");

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

        // Add Order
        _ctx.Orders.Add(order);

        // Add Payment record
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Amount = totalAmount,
            PaymentMethod = req.PaymentMethod,
            Status = 0 // Pending
        };
        _ctx.Payments.Add(payment);

        // Remove from cart
        _ctx.CartItems.RemoveRange(cartItems);

        await _ctx.SaveChangesAsync(ct);

        // Notify Store Staff & Owner via SignalR
        var staffIds = await _ctx.StoreStaffs
            .Where(s => s.StoreId == storeId)
            .Select(s => s.UserId)
            .ToListAsync(ct);

        foreach (var uid in staffIds.Distinct())
        {
            await _hubContext.Clients.Group($"User_{uid}").SendAsync("NewOrderReceived", order.Id, cancellationToken: ct);
        }

        string? checkoutUrl = null;
        if (req.PaymentMethod == 1) // PayOS
        {
            try
            {
                var payOSResult = await _payOSService.CreatePaymentLink(orderCode, totalAmount, $"DH {orderCode}", order.Id.ToString());
                checkoutUrl = payOSResult.CheckoutUrl;
            }
            catch (Exception ex)
            {
                // If PayOS fails, we should probably revert the transaction or return an error.
                throw new Exception("Lỗi khi tạo link thanh toán PayOS: " + ex.Message);
            }
        }

        return new CheckoutResponseDTO
        {
            OrderId = order.Id,
            PickupCode = pickupCode,
            CheckoutUrl = checkoutUrl,
            ReservationExpiresAt = order.ReservationExpiresAt
        };
    }

    public async Task<bool> VerifyPickupAsync(Guid orderId, string pickupCode, Guid userId, CancellationToken ct = default)
    {
        var order = await _ctx.Orders
            .Include(o => o.Store)
                .ThenInclude(s => s.StoreStaffs)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            throw new Exception("Đơn hàng không tồn tại.");

        // Check permission (StoreOwner or Staff)
        bool isStaff = order.Store.StoreStaffs.Any(s => s.UserId == userId);
        if (!isStaff)
            throw new Exception("Bạn không có quyền xác nhận đơn hàng của cửa hàng này.");

        if (order.OrderStatus == 4)
            throw new Exception("Đơn hàng đã bị huỷ.");
        if (order.OrderStatus == 2)
            throw new Exception("Đơn hàng đã được xác nhận lấy hàng trước đó.");
        
        if (order.PickupCode != pickupCode)
            throw new Exception("Mã nhận hàng không chính xác.");

        if (order.Payment != null && order.Payment.PaymentMethod == 1 && order.Payment.Status == 0) // PayOS but pending
        {
            throw new Exception("Đơn hàng thanh toán online chưa hoàn tất thanh toán. Vui lòng kiểm tra lại.");
        }

        order.OrderStatus = 2; // Completed / Delivered
        order.ConfirmedById = userId;

        // Process store wallet (add money to store - minus 5% platform fee)
        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, ct);
        if (storeWallet != null)
        {
            decimal platformFee = order.TotalAmount * 0.05m;
            decimal storeIncome = order.TotalAmount - platformFee;

            storeWallet.AvailableBalance += storeIncome;
            
            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = storeWallet.Id,
                OrderId = order.Id,
                Amount = storeIncome,
                Type = 1, // Income
                Status = 1, // Completed
                Description = $"Thu nhập từ đơn hàng {order.OrderCode ?? 0} (Đã trừ 5% phí nền tảng)"
            });
        }

        await _ctx.SaveChangesAsync(ct);

        // Notify user via SignalR
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusChanged", order.Id, 2, ct);

        return true;
    }

    public async Task<List<OrderHistoryDTO>> GetMyOrdersAsync(Guid userId, CancellationToken ct = default)
    {
        var orders = await _ctx.Orders
            .Include(o => o.Store)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Listing)
                    .ThenInclude(l => l.ListingImages)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

        return orders.Select(o => new OrderHistoryDTO
        {
            Id = o.Id,
            StoreId = o.StoreId,
            StoreName = o.Store.Name,
            TotalAmount = o.TotalAmount,
            OrderStatus = o.OrderStatus,
            CreatedAt = o.CreatedAt,
            TotalItems = o.OrderItems.Sum(oi => oi.Quantity),
            FirstItemImageUrl = o.OrderItems.FirstOrDefault()?.Listing?.ListingImages.FirstOrDefault()?.ImageUrl
        }).ToList();
    }

    public async Task<OrderDetailDTO> GetOrderByIdAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var order = await _ctx.Orders
            .Include(o => o.Store)
            .Include(o => o.Payment)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Listing)
                    .ThenInclude(l => l.ListingImages)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId, ct);

        if (order == null)
            throw new Exception("Không tìm thấy đơn hàng.");

        return new OrderDetailDTO
        {
            Id = order.Id,
            StoreId = order.StoreId,
            StoreName = order.Store.Name,
            StoreAddress = $"{order.Store.DetailedAddress}, {order.Store.Ward}, {order.Store.City}".Replace(" ,", ",").Trim(',', ' '),
            TotalAmount = order.TotalAmount,
            OrderStatus = order.OrderStatus,
            CreatedAt = order.CreatedAt,
            PickupCode = order.PickupCode,
            OrderCode = order.OrderCode,
            ReservationExpiresAt = order.ReservationExpiresAt,
            ConfirmedById = order.ConfirmedById,
            Payment = order.Payment != null ? new OrderPaymentDTO
            {
                PaymentMethod = order.Payment.PaymentMethod,
                Status = order.Payment.Status,
                PaidAt = order.Payment.PaidAt
            } : null,
            Items = order.OrderItems.Select(oi => new OrderLineItemDTO
            {
                Id = oi.Id,
                ListingId = oi.ListingId,
                Title = oi.ProductNameSnapshot,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPriceSnapshot,
                ImageUrl = oi.Listing?.ListingImages.FirstOrDefault()?.ImageUrl
            }).ToList()
        };
    }
    public async Task<bool> ExtendPickupTimeAsync(Guid orderId, Guid userId, int additionalMinutes, CancellationToken ct = default)
    {
        var order = await _ctx.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId, ct);
        
        if (order == null)
            throw new Exception("Không tìm thấy đơn hàng.");

        if (order.OrderStatus != 1)
            throw new Exception("Chỉ có thể gia hạn giờ lấy cho đơn hàng đã thanh toán và đang chờ lấy.");

        if (!order.ExpectedPickupTime.HasValue || !order.MaxPickupTime.HasValue)
            throw new Exception("Đơn hàng này không hỗ trợ hẹn giờ lấy.");

        var newPickupTime = order.ExpectedPickupTime.Value.AddMinutes(additionalMinutes);

        if (newPickupTime > order.MaxPickupTime.Value)
            throw new Exception("Thời gian gia hạn vượt quá giới hạn cho phép (Quá giờ đóng cửa hoặc quá hạn sử dụng của món ăn).");

        order.ExpectedPickupTime = newPickupTime;
        await _ctx.SaveChangesAsync(ct);
        
        return true;
    }

    public async Task<bool> CancelOrderAsync(Guid orderId, Guid userId, CancelOrderRequestDTO req, CancellationToken ct = default)
    {
        var order = await _ctx.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId, ct);
        
        if (order == null)
            throw new Exception("Không tìm thấy đơn hàng.");

        if (order.OrderStatus != 1) // 1 = Confirmed/Paid Wait for pickup
            throw new Exception("Chỉ có thể hủy đơn hàng đang chờ lấy hàng.");

        decimal refundAmount = order.TotalAmount;
        
        if (order.ConfirmedById.HasValue)
        {
            // Case 2: Store has confirmed -> Refund 80%, Platform 5%, Store 15%
            refundAmount = order.TotalAmount * 0.8m;
            decimal storeCompensation = order.TotalAmount * 0.15m;
            
            var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, ct);
            if (storeWallet != null)
            {
                storeWallet.AvailableBalance += storeCompensation;
                
                var tx = new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    StoreWalletId = storeWallet.Id,
                    Type = 1, // 1 = Deposit/Income
                    Amount = storeCompensation,
                    Description = $"Đền bù hủy đơn {order.OrderCode} (15%)",
                    CreatedAt = DateTime.UtcNow,
                    OrderId = order.Id,
                    Status = 1 // 1 = Completed
                };
                _ctx.WalletTransactions.Add(tx);
            }
        }
        else
        {
            // Case 1: Store hasn't confirmed -> Refund 100%
            refundAmount = order.TotalAmount;
        }

        var refundReq = new RefundRequest
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            RequestedBy = userId,
            Amount = refundAmount,
            Reason = req.Reason,
            Status = 0, // Pending
            CreatedAt = DateTime.UtcNow,
            CustomerBankName = req.BankName,
            CustomerBankAccount = req.BankAccount,
            CustomerBankAccountName = req.BankAccountName
        };
        _ctx.RefundRequests.Add(refundReq);

        // Return stock
        foreach (var item in order.OrderItems)
        {
            var listing = await _ctx.ClearanceListings.FindAsync(new object[] { item.ListingId }, ct);
            if (listing != null)
            {
                listing.QuantityAvailable += item.Quantity;
            }
        }

        order.OrderStatus = 4; // Cancelled
        await _ctx.SaveChangesAsync(ct);
        
        return true;
    }

    private string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
