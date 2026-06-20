using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.DTOs;
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

        if (req.PaymentMethod != 0 && req.PaymentMethod != 1)
            throw new Exception("Phương thức thanh toán không hợp lệ.");

        // Generate shared Codes
        long orderCode = long.Parse(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString());
        
        var storeGroups = cartItems.GroupBy(ci => ci.Listing.Product.StoreId).ToList();
        decimal grandTotalAmount = 0;
        var createdOrders = new List<Order>();
        var firstOrderId = Guid.Empty;
        string firstPickupCode = "";

        foreach (var group in storeGroups)
        {
            var storeId = group.Key;
            var storeItems = group.ToList();

            decimal storeTotalAmount = 0;
            foreach (var item in storeItems)
            {
                if (item.Listing.ExpiryDate <= DateTime.UtcNow)
                    throw new Exception($"Sản phẩm '{item.Listing.Title}' đã hết hạn.");

                storeTotalAmount += item.Listing.SalePrice * item.Quantity;
            }
            grandTotalAmount += storeTotalAmount;

            string pickupCode = GenerateRandomCode(6);

            // Calculate MaxPickupTime (min of EndOfDay or Earliest ExpiryDate)
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
                OrderStatus = 0, // PendingPayment
                PickupCode = pickupCode,
                OrderCode = orderCode, // SHARING ORDER CODE ACROSS STORES
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

            _ctx.Orders.Add(order);
            createdOrders.Add(order);

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                Amount = storeTotalAmount,
                PaymentMethod = req.PaymentMethod,
                Status = 0 // Pending
            };
            _ctx.Payments.Add(payment);
        }

        // Remove from cart
        _ctx.CartItems.RemoveRange(cartItems);

        await _ctx.SaveChangesAsync(ct);

        // Notify Store Staff & Owner via SignalR
        foreach (var order in createdOrders)
        {
            var staffIds = await _ctx.StoreStaffs
                .Where(s => s.StoreId == order.StoreId)
                .Select(s => s.UserId)
                .ToListAsync(ct);

            foreach (var uid in staffIds.Distinct())
            {
                await _hubContext.Clients.Group($"User_{uid}").SendAsync("NewOrderReceived", order.Id, cancellationToken: ct);
            }
        }

        string? checkoutUrl = null;
        if (req.PaymentMethod == 1) // PayOS
        {
            try
            {
                // Note: we just pass OrderCode, don't pass specific order.Id to ReturnUrl since we might have multiple
                var payOSResult = await _payOSService.CreatePaymentLink(orderCode, grandTotalAmount, $"DH {orderCode}", orderCode.ToString(), req.ReturnUrl, req.CancelUrl);
                checkoutUrl = payOSResult.CheckoutUrl;
            }
            catch (Exception ex)
            {
                throw new Exception("Lỗi khi tạo link thanh toán PayOS: " + ex.Message);
            }
        }
        else if (req.PaymentMethod == 0) // Wallet
        {
            var customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);
            if (customerWallet == null || customerWallet.Balance < grandTotalAmount)
            {
                throw new Exception("Số dư trong Ví SaveFood không đủ để thanh toán.");
            }

            customerWallet.Balance -= grandTotalAmount;
            
            foreach (var order in createdOrders)
            {
                _ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
                {
                    Id = Guid.NewGuid(),
                    CustomerWalletId = customerWallet.Id,
                    Amount = order.TotalAmount,
                    Type = 2, // Payment
                    Status = 1, // Completed
                    OrderId = order.Id,
                    Description = $"Thanh toán đơn hàng DH {orderCode}"
                });

                var p = await _ctx.Payments.FirstOrDefaultAsync(x => x.OrderId == order.Id, ct);
                if (p != null)
                {
                    p.Status = 1; // Completed
                    p.PaidAt = DateTime.UtcNow;
                    order.ReservationExpiresAt = null; // Clear payment timer

                    var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, ct);
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
                    decimal platformFee = order.TotalAmount * 0.05m;
                    storeWallet.PendingBalance += (order.TotalAmount - platformFee);
                }
            }
            await _ctx.SaveChangesAsync(ct);
        }

        return new CheckoutResponseDTO
        {
            OrderId = firstOrderId, // We just return the first order ID for backward compatibility, though Return URL now uses orderCode
            PickupCode = firstPickupCode,
            CheckoutUrl = checkoutUrl,
            ReservationExpiresAt = createdOrders.FirstOrDefault()?.ReservationExpiresAt
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
        if (order.OrderStatus == 3)
            throw new Exception("Đơn hàng đã được xác nhận lấy hàng trước đó.");
        
        if (order.PickupCode != pickupCode)
            throw new Exception("Mã nhận hàng không chính xác.");

        if (order.Payment != null && order.Payment.PaymentMethod == 1 && order.Payment.Status == 0) // PayOS but pending
        {
            throw new Exception("Đơn hàng thanh toán online chưa hoàn tất thanh toán. Vui lòng kiểm tra lại.");
        }

        order.OrderStatus = 3; // Completed / Delivered
        order.ConfirmedById = userId;

        // Process store wallet (add money to store - minus 5% platform fee)
        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, ct);
        if (storeWallet != null)
        {
            decimal platformFee = order.TotalAmount * 0.05m;
            decimal storeIncome = order.TotalAmount - platformFee;

            storeWallet.AvailableBalance += storeIncome;
            
            if (order.Payment != null && order.Payment.Status == 1) // Paid
            {
                storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);
            }
            
            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = storeWallet.Id,
                OrderId = order.Id,
                Amount = order.TotalAmount,
                Type = 1, // Income
                Status = 1, // Completed
                Description = $"Doanh thu từ đơn hàng {order.OrderCode ?? 0}"
            });
            
            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = storeWallet.Id,
                OrderId = order.Id,
                Amount = platformFee,
                Type = 2, // PlatformFee
                Status = 1, // Completed
                Description = $"Phí nền tảng (5%) từ đơn hàng {order.OrderCode ?? 0}"
            });
        }

        await _ctx.SaveChangesAsync(ct);

        // Notify user via SignalR
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusChanged", order.Id, 2, ct);

        return true;
    }

    public async Task<PagedResult<OrderHistoryDTO>> GetMyOrdersAsync(Guid userId, int? status = null, int page = 1, int pageSize = 5, CancellationToken ct = default)
    {
        var query = _ctx.Orders
            .Include(o => o.Store)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Listing)
                    .ThenInclude(l => l.ListingImages)
            .Where(o => o.UserId == userId);

        if (status.HasValue)
        {
            query = query.Where(o => o.OrderStatus == status.Value);
        }

        var totalRecords = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var data = orders.Select(o => new OrderHistoryDTO
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

        return new PagedResult<OrderHistoryDTO>
        {
            Data = data,
            TotalRecords = totalRecords,
            TotalPages = totalPages,
            CurrentPage = page,
            PageSize = pageSize
        };
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

        if (order.ConfirmedById.HasValue)
            throw new Exception("Không thể hủy đơn hàng đã được quán xác nhận hoặc đang chuẩn bị.");

        // Refund 100% to Customer Wallet
        var customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);
        if (customerWallet == null)
        {
            customerWallet = new CustomerWallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _ctx.CustomerWallets.Add(customerWallet);
        }

        customerWallet.Balance += order.TotalAmount;
        
        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, ct);
        if (storeWallet != null)
        {
            decimal platformFee = order.TotalAmount * 0.05m;
            decimal storeIncome = order.TotalAmount - platformFee;
            storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);
        }
        
        _ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
        {
            Id = Guid.NewGuid(),
            CustomerWalletId = customerWallet.Id,
            Amount = order.TotalAmount,
            Type = 3, // Refund
            Status = 1, // Completed
            OrderId = order.Id,
            Description = $"Hoàn tiền đơn hàng {order.OrderCode ?? 0}"
        });

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
        
        var staffIds = await _ctx.StoreStaffs
            .Where(s => s.StoreId == order.StoreId)
            .Select(s => s.UserId)
            .ToListAsync(ct);
            
        foreach (var staffId in staffIds)
        {
            await _hubContext.Clients.Group($"User_{staffId}").SendAsync("OrderStatusUpdated", order.Id, order.OrderStatus, cancellationToken: ct);
        }

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
