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
    private readonly INotificationService _notifService;

    public OrderService(SaveFoodDbContext ctx, IPayOSService payOSService, IHubContext<NotificationHub> hubContext, INotificationService notifService)
    {
        _ctx = ctx;
        _payOSService = payOSService;
        _hubContext = hubContext;
        _notifService = notifService;
    }

    public async Task<CheckoutResponseDTO> CheckoutAsync(Guid userId, CheckoutRequestDTO req, CancellationToken ct = default)
    {
        if (!req.AgreedToNoRefundPolicy)
            throw new Exception("BÃ¡ÂºÂ¡n phÃ¡ÂºÂ£i Ã„â€˜Ã¡Â»â€œng ÃƒÂ½ vÃ¡Â»â€ºi chÃƒÂ­nh sÃƒÂ¡ch khÃƒÂ´ng hoÃƒÂ n tiÃ¡Â»Ân nÃ¡ÂºÂ¿u khÃƒÂ´ng Ã„â€˜Ã¡ÂºÂ¿n lÃ¡ÂºÂ¥y hÃƒÂ ng.");

        if (req.CartItemIds == null || !req.CartItemIds.Any())
            throw new Exception("GiÃ¡Â»Â hÃƒÂ ng trÃ¡Â»â€˜ng hoÃ¡ÂºÂ·c chÃ†Â°a chÃ¡Â»Ân sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m.");

        var cartItems = await _ctx.CartItems
            .Include(ci => ci.Listing)
                .ThenInclude(l => l.Product)
                    .ThenInclude(p => p.Store)
            .Where(ci => req.CartItemIds.Contains(ci.Id) && ci.Cart.UserId == userId)
            .ToListAsync(ct);

        if (cartItems.Count != req.CartItemIds.Count)
            throw new Exception("CÃƒÂ³ sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡ trong giÃ¡Â»Â hÃƒÂ ng.");

        if (req.PaymentMethod != 0 && req.PaymentMethod != 1)
            throw new Exception("PhÃ†Â°Ã†Â¡ng thÃ¡Â»Â©c thanh toÃƒÂ¡n khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡.");

        // Generate shared Codes
        long orderCode = long.Parse(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString());

        // Validate wallet balance BEFORE modifying DB state
        decimal totalCheckoutAmount = cartItems.Sum(ci => ci.Listing.SalePrice * ci.Quantity);
        CustomerWallet? customerWallet = null;
        if (req.PaymentMethod == 0) // Wallet
        {
            customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);
            if (customerWallet == null || customerWallet.Balance < totalCheckoutAmount)
            {
                throw new Exception("SÃ¡Â»â€˜ dÃ†Â° trong VÃƒÂ­ SaveFood khÃƒÂ´ng Ã„â€˜Ã¡Â»Â§ Ã„â€˜Ã¡Â»Æ’ thanh toÃƒÂ¡n.");
            }
        }
        
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
                if (item.Listing.Product.Store.Status != (byte)SaveFoodBackend.Models.Enums.StoreStatus.Active)
                    throw new Exception($"CÃ¡Â»Â­a hÃƒÂ ng '{item.Listing.Product.Store.Name}' hiÃ¡Â»â€¡n Ã„â€˜ang tÃ¡ÂºÂ¡m nghÃ¡Â»â€°, khÃƒÂ´ng thÃ¡Â»Æ’ thanh toÃƒÂ¡n.");

                if (item.Listing.ExpiryDate <= DateTime.UtcNow)
                    throw new Exception($"SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m '{item.Listing.Title}' Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n.");

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
                    throw new Exception($"SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m '{item.Listing.Title}' khÃƒÂ´ng Ã„â€˜Ã¡Â»Â§ sÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng trong kho hoÃ¡ÂºÂ·c Ã„â€˜ÃƒÂ£ cÃƒÂ³ ngÃ†Â°Ã¡Â»Âi khÃƒÂ¡c Ã„â€˜Ã¡ÂºÂ·t mua.");

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

        // (Notifications moved to Wallet payment block and HandleSuccessfulPayment)
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
                throw new Exception("LÃ¡Â»â€”i khi tÃ¡ÂºÂ¡o link thanh toÃƒÂ¡n PayOS: " + ex.Message);
            }
        }
        else if (req.PaymentMethod == 0) // Wallet
        {
            // Validated early
            if (customerWallet == null) 
                throw new Exception("LÃ¡Â»â€”i hÃ¡Â»â€¡ thÃ¡Â»â€˜ng: KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y vÃƒÂ­ khÃƒÂ¡ch hÃƒÂ ng.");
            
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
                    Description = $"Thanh toÃƒÂ¡n Ã„â€˜Ã†Â¡n hÃƒÂ ng DH {orderCode}"
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
            
            // Send Notifications for Wallet Payment (since it's already Paid)
            foreach (var order in createdOrders)
            {
                await _notifService.SendAsync(order.UserId, "Ã„ÂÃ¡ÂºÂ·t hÃƒÂ ng thÃƒÂ nh cÃƒÂ´ng! Ã°Å¸Å½â€°", $"Ã„ÂÃ†Â¡n hÃƒÂ ng #{order.OrderCode} Ã„â€˜ÃƒÂ£ thanh toÃƒÂ¡n bÃ¡ÂºÂ±ng vÃƒÂ­. Vui lÃƒÂ²ng Ã„â€˜Ã¡ÂºÂ¿n lÃ¡ÂºÂ¥y hÃƒÂ ng Ã„â€˜ÃƒÂºng giÃ¡Â»Â.", "ORDER_PLACED", order.Id);
                var staffIds = await _ctx.StoreStaffs.Where(s => s.StoreId == order.StoreId).Select(s => s.UserId).ToListAsync(ct);
                foreach (var uid in staffIds.Distinct())
                {
                    await _notifService.SendAsync(uid, "CÃƒÂ³ Ã„â€˜Ã†Â¡n hÃƒÂ ng mÃ¡Â»â€ºi! Ã°Å¸â€ºâ€™", $"Ã„ÂÃ†Â¡n #{order.OrderCode} vÃ¡Â»Â«a Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡ÂºÂ·t vÃƒÂ  thanh toÃƒÂ¡n. HÃƒÂ£y chuÃ¡ÂºÂ©n bÃ¡Â»â€¹ hÃƒÂ ng cho khÃƒÂ¡ch.", "ORDER_PLACED", order.Id);
                }
            }
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
            throw new Exception("Ã„ÂÃ†Â¡n hÃƒÂ ng khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i.");

        // Check permission (StoreOwner or Staff)
        bool isStaff = order.Store.StoreStaffs.Any(s => s.UserId == userId);
        if (!isStaff)
            throw new Exception("BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân xÃƒÂ¡c nhÃ¡ÂºÂ­n Ã„â€˜Ã†Â¡n hÃƒÂ ng cÃ¡Â»Â§a cÃ¡Â»Â­a hÃƒÂ ng nÃƒÂ y.");

        if (order.OrderStatus == 4)
            throw new Exception("Ã„ÂÃ†Â¡n hÃƒÂ ng Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ huÃ¡Â»Â·.");
        if (order.OrderStatus == 3)
            throw new Exception("Ã„ÂÃ†Â¡n hÃƒÂ ng Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c xÃƒÂ¡c nhÃ¡ÂºÂ­n lÃ¡ÂºÂ¥y hÃƒÂ ng trÃ†Â°Ã¡Â»â€ºc Ã„â€˜ÃƒÂ³.");
        
        if (order.PickupCode != pickupCode)
            throw new Exception("MÃƒÂ£ nhÃ¡ÂºÂ­n hÃƒÂ ng khÃƒÂ´ng chÃƒÂ­nh xÃƒÂ¡c.");

        if (order.Payment != null && order.Payment.PaymentMethod == 1 && order.Payment.Status == 0) // PayOS but pending
        {
            throw new Exception("Ã„ÂÃ†Â¡n hÃƒÂ ng thanh toÃƒÂ¡n online chÃ†Â°a hoÃƒÂ n tÃ¡ÂºÂ¥t thanh toÃƒÂ¡n. Vui lÃƒÂ²ng kiÃ¡Â»Æ’m tra lÃ¡ÂºÂ¡i.");
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
                Description = $"Doanh thu tÃ¡Â»Â« Ã„â€˜Ã†Â¡n hÃƒÂ ng {order.OrderCode ?? 0}"
            });
            
            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = storeWallet.Id,
                OrderId = order.Id,
                Amount = platformFee,
                Type = 2, // PlatformFee
                Status = 1, // Completed
                Description = $"PhÃƒÂ­ nÃ¡Â»Ân tÃ¡ÂºÂ£ng (5%) tÃ¡Â»Â« Ã„â€˜Ã†Â¡n hÃƒÂ ng {order.OrderCode ?? 0}"
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
            .Include(o => o.Payment)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Listing)
                    .ThenInclude(l => l.ListingImages)
            .Where(o => o.UserId == userId);

        if (status.HasValue)
        {
            if (status.Value == -2)
            {
                query = query.Where(o => o.OrderStatus == 0 && o.Payment != null && o.Payment.PaymentMethod == 1 && (o.Payment.Status == 0 || o.Payment.Status == 2));
            }
            else if (status.Value == 0)
            {
                query = query.Where(o => o.OrderStatus == 0 && (o.Payment == null || o.Payment.PaymentMethod == 0 || (o.Payment.PaymentMethod == 1 && o.Payment.Status == 1)));
            }
            else
            {
                query = query.Where(o => o.OrderStatus == status.Value);
            }
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
            FirstItemImageUrl = o.OrderItems.FirstOrDefault()?.Listing?.ListingImages.FirstOrDefault()?.ImageUrl,
            PaymentMethod = o.Payment?.PaymentMethod ?? 0,
            PaymentStatus = o.Payment?.Status
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
            throw new Exception("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y Ã„â€˜Ã†Â¡n hÃƒÂ ng.");

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
            throw new Exception("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y Ã„â€˜Ã†Â¡n hÃƒÂ ng.");

        if (order.OrderStatus != 1)
            throw new Exception("ChÃ¡Â»â€° cÃƒÂ³ thÃ¡Â»Æ’ gia hÃ¡ÂºÂ¡n giÃ¡Â»Â lÃ¡ÂºÂ¥y cho Ã„â€˜Ã†Â¡n hÃƒÂ ng Ã„â€˜ÃƒÂ£ thanh toÃƒÂ¡n vÃƒÂ  Ã„â€˜ang chÃ¡Â»Â lÃ¡ÂºÂ¥y.");

        if (!order.ExpectedPickupTime.HasValue || !order.MaxPickupTime.HasValue)
            throw new Exception("Ã„ÂÃ†Â¡n hÃƒÂ ng nÃƒÂ y khÃƒÂ´ng hÃ¡Â»â€” trÃ¡Â»Â£ hÃ¡ÂºÂ¹n giÃ¡Â»Â lÃ¡ÂºÂ¥y.");

        var newPickupTime = order.ExpectedPickupTime.Value.AddMinutes(additionalMinutes);

        if (newPickupTime > order.MaxPickupTime.Value)
            throw new Exception("ThÃ¡Â»Âi gian gia hÃ¡ÂºÂ¡n vÃ†Â°Ã¡Â»Â£t quÃƒÂ¡ giÃ¡Â»â€ºi hÃ¡ÂºÂ¡n cho phÃƒÂ©p (QuÃƒÂ¡ giÃ¡Â»Â Ã„â€˜ÃƒÂ³ng cÃ¡Â»Â­a hoÃ¡ÂºÂ·c quÃƒÂ¡ hÃ¡ÂºÂ¡n sÃ¡Â»Â­ dÃ¡Â»Â¥ng cÃ¡Â»Â§a mÃƒÂ³n Ã„Æ’n).");

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
            throw new Exception("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y Ã„â€˜Ã†Â¡n hÃƒÂ ng.");

        if (order.OrderStatus != 1) // 1 = Confirmed/Paid Wait for pickup
            throw new Exception("ChÃ¡Â»â€° cÃƒÂ³ thÃ¡Â»Æ’ hÃ¡Â»Â§y Ã„â€˜Ã†Â¡n hÃƒÂ ng Ã„â€˜ang chÃ¡Â»Â lÃ¡ÂºÂ¥y hÃƒÂ ng.");

        if (order.ConfirmedById.HasValue)
            throw new Exception("KhÃƒÂ´ng thÃ¡Â»Æ’ hÃ¡Â»Â§y Ã„â€˜Ã†Â¡n hÃƒÂ ng Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c quÃƒÂ¡n xÃƒÂ¡c nhÃ¡ÂºÂ­n hoÃ¡ÂºÂ·c Ã„â€˜ang chuÃ¡ÂºÂ©n bÃ¡Â»â€¹.");

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
            Description = $"HoÃƒÂ n tiÃ¡Â»Ân Ã„â€˜Ã†Â¡n hÃƒÂ ng {order.OrderCode ?? 0}"
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
            await _notifService.SendAsync(
                staffId,
                "Ã„ÂÃ†Â¡n hÃƒÂ ng bÃ¡Â»â€¹ hÃ¡Â»Â§y",
                $"Ã„ÂÃ†Â¡n #{order.OrderCode} Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ khÃƒÂ¡ch hÃ¡Â»Â§y.",
                "ORDER_STATUS_CHANGED",
                order.Id
            );
        }

        // Notify customer about refund
        await _notifService.SendAsync(
            order.UserId,
            "HÃ¡Â»Â§y Ã„â€˜Ã†Â¡n thÃƒÂ nh cÃƒÂ´ng Ã¢â‚¬â€ HoÃƒÂ n tiÃ¡Â»Ân",
            $"Ã„ÂÃ†Â¡n #{order.OrderCode} Ã„â€˜ÃƒÂ£ hÃ¡Â»Â§y. {order.TotalAmount:N0}Ã¢â€šÂ« Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c hoÃƒÂ n vÃƒÂ o vÃƒÂ­ cÃ¡Â»Â§a bÃ¡ÂºÂ¡n.",
            "ORDER_STATUS_CHANGED",
            order.Id
        );

        return true;
    }

    private string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

        public async Task<CheckoutResponseDTO> BatchPayAsync(Guid userId, List<Guid> orderIds, byte paymentMethod, string? returnUrl, string? cancelUrl, CancellationToken ct = default)
    {
        var orders = await _ctx.Orders
            .Include(o => o.Payment)
            .Where(o => orderIds.Contains(o.Id) && o.UserId == userId)
            .ToListAsync(ct);

        if (orders.Count != orderIds.Count) throw new Exception("KhÃ´ng tÃ¬m tháº¥y má»™t sá»‘ Ä‘Æ¡n hÃ ng, hoáº·c báº¡n khÃ´ng cÃ³ quyá» n thanh toÃ¡n.");
        if (orders.Any(o => o.OrderStatus != 0 || o.Payment == null || (o.Payment.Status != 0 && o.Payment.Status != 2)))
            throw new Exception("Chỉ có thể thanh toán lại các đơn hàng đang chờ thanh toán.");

        decimal grandTotal = orders.Sum(o => o.TotalAmount);

        if (paymentMethod == 0) // Wallet
        {
            var customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);
            if (customerWallet != null && customerWallet.Balance >= grandTotal) 
            {
                customerWallet.Balance -= grandTotal;
                foreach (var order in orders)
                {
                    order.Payment.PaymentMethod = 0;
                    order.Payment.Status = 1;
                    order.Payment.PaidAt = DateTime.UtcNow;
                    order.ReservationExpiresAt = null;

                    _ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        CustomerWalletId = customerWallet.Id,
                        Amount = order.TotalAmount,
                        Type = 2,
                        Status = 1,
                        OrderId = order.Id,
                        Description = "Thanh toÃ¡n Ä‘Æ¡n hÃ ng DH " + order.OrderCode
                    });

                    var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, ct);
                    if (storeWallet == null) {
                        storeWallet = new StoreWallet { Id = Guid.NewGuid(), StoreId = order.StoreId, AvailableBalance = 0, PendingBalance = 0, UpdatedAt = DateTime.UtcNow };
                        _ctx.StoreWallets.Add(storeWallet);
                    }
                    decimal platformFee = order.TotalAmount * 0.05m;
                    storeWallet.PendingBalance += (order.TotalAmount - platformFee);
                }
                await _ctx.SaveChangesAsync(ct);

                foreach (var order in orders)
                {
                    await _notifService.SendAsync(order.UserId, "Thanh toÃ¡n thÃ nh cÃ´ng!", "ÄÆ¡n hÃ ng #" + order.OrderCode + " Ä‘Ã£ thanh toÃ¡n báº±ng vÃ­.", "ORDER_PLACED", order.Id);
                    var staffIds = await _ctx.StoreStaffs.Where(s => s.StoreId == order.StoreId).Select(s => s.UserId).ToListAsync(ct);
                    foreach (var uid in staffIds.Distinct())
                        await _notifService.SendAsync(uid, "CÃ³ Ä‘Æ¡n hÃ ng má»›i!", "ÄÆ¡n #" + order.OrderCode + " vá»«a Ä‘Æ°á»£c Ä‘áº·t vÃ  thanh toÃ¡n.", "ORDER_PLACED", order.Id);
                }

                return new CheckoutResponseDTO { OrderId = orders.First().Id, CheckoutUrl = null };
            }
            paymentMethod = 1; // Fallback to PayOS
        }

        if (paymentMethod == 1) // PayOS
        {
            long newOrderCode = long.Parse(DateTimeOffset.UtcNow.ToString("yyMMddHHmmss") + new Random().Next(100, 999).ToString());
            foreach (var order in orders)
            {
                order.OrderCode = newOrderCode;
                order.Payment.PaymentMethod = 1;
                order.Payment.Status = 0;
                order.ReservationExpiresAt = DateTime.UtcNow.AddMinutes(10);
            }
            await _ctx.SaveChangesAsync(ct);

            var payOSResult = await _payOSService.CreatePaymentLink(newOrderCode, grandTotal, $"DH {newOrderCode}", newOrderCode.ToString(), returnUrl, cancelUrl);
            return new CheckoutResponseDTO
            {
                OrderId = orders.First().Id,
                CheckoutUrl = payOSResult.CheckoutUrl,
                ReservationExpiresAt = orders.First().ReservationExpiresAt
            };
        }

        throw new Exception("PhÆ°Æ¡ng thá»©c thanh toÃ¡n khÃ´ng há»£p lá»‡.");
    }

    public async Task HandleSuccessfulPayment(long orderCode, PayOS.Models.Webhooks.WebhookData data)
    {
        await ProcessPaymentSuccessAsync(orderCode, data.Reference, data.CounterAccountNumber, data.CounterAccountName, data.CounterAccountBankId);
    }

    public async Task ProcessPaymentSuccessAsync(long orderCode, string reference, string accNum, string accName, string bankId)
    {
        int retries = 3;
        while (retries > 0)
        {
            try
            {
                using var uow = await _ctx.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                
                var orders = await _ctx.Orders.Include(o => o.Payment).Where(o => o.OrderCode == orderCode).ToListAsync();
                if (orders.Any())
                {
                    bool stateChanged = false;
                    foreach (var order in orders)
                    {
                        if (order.Payment != null && order.Payment.Status == 0)
                        {
                            stateChanged = true;
                            order.Payment.Status = 1;
                            order.Payment.PaidAt = DateTime.UtcNow;
                            order.ReservationExpiresAt = null;

                            order.Payment.PayOsReference = reference;
                            order.Payment.PayerAccountNumber = accNum;
                            order.Payment.PayerName = accName;
                            order.Payment.PayerBankId = bankId;

                            var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId);
                            if (storeWallet == null)
                            {
                                storeWallet = new StoreWallet { Id = Guid.NewGuid(), StoreId = order.StoreId, AvailableBalance = 0, PendingBalance = 0, UpdatedAt = DateTime.UtcNow };
                                _ctx.StoreWallets.Add(storeWallet);
                            }
                            decimal platformFee = order.TotalAmount * 0.05m;
                            storeWallet.PendingBalance += (order.TotalAmount - platformFee);
                        }
                    }

                    if (stateChanged)
                    {
                        await _ctx.SaveChangesAsync();
                        await uow.CommitAsync();

                        // Only send notifications AFTER commit succeeds!
                        foreach (var order in orders)
                        {
                            await _notifService.SendAsync(order.UserId, "Thanh toÃƒÂ¡n thÃƒÂ nh cÃƒÂ´ng! Ã°Å¸Å½â€°", $"Ã„ÂÃ†Â¡n hÃƒÂ ng #{order.OrderCode} Ã„â€˜ÃƒÂ£ thanh toÃƒÂ¡n. Vui lÃƒÂ²ng Ã„â€˜Ã¡ÂºÂ¿n lÃ¡ÂºÂ¥y hÃƒÂ ng Ã„â€˜ÃƒÂºng giÃ¡Â»Â.", "ORDER_PLACED", order.Id);
                            var staffIds = await _ctx.StoreStaffs.Where(s => s.StoreId == order.StoreId).Select(s => s.UserId).ToListAsync();
                            foreach (var uid in staffIds.Distinct())
                            {
                                await _notifService.SendAsync(uid, "CÃƒÂ³ Ã„â€˜Ã†Â¡n hÃƒÂ ng mÃ¡Â»â€ºi! Ã°Å¸â€ºâ€™", $"Ã„ÂÃ†Â¡n #{order.OrderCode} vÃ¡Â»Â«a Ã„â€˜Ã†Â°Ã¡Â»Â£c thanh toÃƒÂ¡n qua PayOS. HÃƒÂ£y chuÃ¡ÂºÂ©n bÃ¡Â»â€¹ hÃƒÂ ng cho khÃƒÂ¡ch.", "ORDER_PLACED", order.Id);
                            }
                        }
                    }
                    else
                    {
                        await uow.RollbackAsync(); // nothing to update
                    }
                }
                else
                {
                    // Handle subscription (omitted for brevity here, or copied if needed. Wait, we should copy the subscription logic from PaymentsController too)
                    var subscription = await _ctx.StoreSubscriptions.FirstOrDefaultAsync(s => s.OrderCode == orderCode);
                    if (subscription != null && subscription.Status == 0)
                    {
                        subscription.Status = 1;
                        subscription.PayOsTransactionId = reference;
                        subscription.PayerAccountNumber = accNum;
                        subscription.PayerName = accName;
                        subscription.PayerBankId = bankId;

                        var activeSubs = await _ctx.StoreSubscriptions.Where(s => s.StoreId == subscription.StoreId && s.Status == 1 && s.Id != subscription.Id).ToListAsync();
                        foreach(var sub in activeSubs) sub.Status = 2;

                        await _ctx.SaveChangesAsync();
                        await uow.CommitAsync();
                    }
                    else
                    {
                        await uow.RollbackAsync();
                    }
                }
                break; // success
            }
            catch (Exception ex) when (ex is DbUpdateException || ex is Microsoft.Data.SqlClient.SqlException)
            {
                retries--;
                if (retries == 0) throw;
                await Task.Delay(200); // backoff
            }
        }
    }
}

