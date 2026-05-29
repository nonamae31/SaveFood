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
        if (req.CartItemIds == null || !req.CartItemIds.Any())
            throw new Exception("Giỏ hàng trống hoặc chưa chọn sản phẩm.");

        var cartItems = await _ctx.CartItems
            .Include(ci => ci.Listing)
                .ThenInclude(l => l.Product)
            .Where(ci => req.CartItemIds.Contains(ci.Id) && ci.Cart.UserId == userId)
            .ToListAsync(ct);

        if (cartItems.Count != req.CartItemIds.Count)
            throw new Exception("Có sản phẩm không hợp lệ trong giỏ hàng.");

        var storeIds = cartItems.Select(ci => ci.Listing.Product.StoreId).Distinct().ToList();
        if (storeIds.Count > 1)
            throw new Exception("Chỉ được thanh toán các sản phẩm của cùng 1 cửa hàng trong 1 lần thanh toán.");

        var storeId = storeIds.First();

        decimal totalAmount = 0;
        foreach (var item in cartItems)
        {
            if (item.Quantity > item.Listing.QuantityAvailable)
                throw new Exception($"Sản phẩm '{item.Listing.Title}' chỉ còn {item.Listing.QuantityAvailable} sản phẩm trong kho.");
            if (item.Listing.ExpiryDate <= DateTime.UtcNow)
                throw new Exception($"Sản phẩm '{item.Listing.Title}' đã hết hạn.");

            totalAmount += item.Listing.SalePrice * item.Quantity;
        }

        // Generate Codes
        string pickupCode = GenerateRandomCode(6);
        long orderCode = long.Parse(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString());

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StoreId = storeId,
            TotalAmount = totalAmount,
            OrderStatus = 0, // PendingPayment (assuming 0 is Pending)
            PickupCode = pickupCode,
            OrderCode = orderCode,
            ReservationExpiresAt = DateTime.UtcNow.AddMinutes(10)
        };

        foreach (var item in cartItems)
        {
            // Deduct stock for reservation
            item.Listing.QuantityAvailable -= item.Quantity;

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

        // If paying at counter, we consider it paid now
        if (order.Payment != null && order.Payment.PaymentMethod == 0 && order.Payment.Status == 0) // Pay At Counter
        {
            order.Payment.Status = 1; // Paid
            order.Payment.PaidAt = DateTime.UtcNow;
        }
        else if (order.Payment != null && order.Payment.PaymentMethod == 1 && order.Payment.Status == 0) // PayOS but pending
        {
            throw new Exception("Đơn hàng thanh toán online chưa hoàn tất thanh toán. Vui lòng kiểm tra lại.");
        }

        order.OrderStatus = 2; // Completed / Delivered
        order.ConfirmedById = userId;

        // Process store wallet (add money to store)
        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, ct);
        if (storeWallet != null)
        {
            storeWallet.AvailableBalance += order.TotalAmount; // Assuming 0% fee for now, or calculate fee here
            
            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = storeWallet.Id,
                OrderId = order.Id,
                Amount = order.TotalAmount,
                Type = 1, // Income
                Status = 1, // Completed
                Description = $"Thu nhập từ đơn hàng {order.OrderCode ?? 0}"
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
            StoreAddress = $"{order.Store.AddressLine}, {order.Store.Ward}, {order.Store.District}, {order.Store.City}".Replace(" ,", ",").Trim(',', ' '),
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

    private string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
