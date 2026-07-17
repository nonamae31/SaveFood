using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Orders.Queries;

/// <summary>
/// DTO nội bộ lưu giỏ hàng của user khác
/// </summary>
public record OtherUserCartItem
{
    public Guid ListingId { get; set; }
    public Guid UserId { get; set; }
    public int Quantity { get; set; }
    public decimal SalePrice { get; set; }
}

/// <summary>
/// Kết quả kiểm tra từng item trong giỏ hàng.
/// </summary>
public record CartItemAvailabilityResult(
    Guid CartItemId,
    Guid ListingId,
    string Title,
    int RequestedQuantity,
    int AvailableQuantity,
    bool IsAvailable,
    string? BlockedReason
);

/// <summary>
/// Kết quả tổng thể: canProceed = false nếu bất kỳ item nào không đủ hàng.
/// </summary>
public record CheckCartAvailabilityResult(
    bool CanProceed,
    List<CartItemAvailabilityResult> Items
);

public record CheckCartAvailabilityQuery(
    Guid UserId,
    List<Guid> CartItemIds
) : IRequest<CheckCartAvailabilityResult>;

public class CheckCartAvailabilityQueryHandler
    : IRequestHandler<CheckCartAvailabilityQuery, CheckCartAvailabilityResult>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly Services.ICheckoutQueueService _queueService;

    public CheckCartAvailabilityQueryHandler(SaveFoodDbContext ctx, Services.ICheckoutQueueService queueService)
    {
        _ctx = ctx;
        _queueService = queueService;
    }

    public async Task<CheckCartAvailabilityResult> Handle(
        CheckCartAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        // ── 1. Lấy các sản phẩm người dùng hiện tại muốn mua ─────────────────
        var cartItems = await _ctx.CartItems
            .Include(ci => ci.Listing)
            .Include(ci => ci.Cart)
            .Where(ci => request.CartItemIds.Contains(ci.Id) && ci.Cart.UserId == request.UserId)
            .ToListAsync(cancellationToken);

        if (!cartItems.Any())
            return new CheckCartAvailabilityResult(false, new List<CartItemAvailabilityResult>());

        var listingIds = cartItems.Select(ci => ci.ListingId).Distinct().ToList();

        // ── 2. Tính priority của người dùng hiện tại ─────────────────────────
        var currentUserSpent = await _ctx.Orders
            .Where(o => o.UserId == request.UserId && o.OrderStatus == OrderStatusEnum.Completed)
            .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0m;
        
        // ── 2.5 Tính totalCheckoutAmount của current user để cho giống priority trong CheckoutCommand
        decimal currentUserCheckoutAmount = cartItems.Sum(ci => ci.Listing.SalePrice * ci.Quantity);

        var currentUserWallet = await _ctx.CustomerWallets
            .Where(w => w.UserId == request.UserId)
            .Select(w => w.Balance)
            .FirstOrDefaultAsync(cancellationToken);
            
        double currentUserPriority = (double)currentUserSpent * 1_000_000_000_000.0
                                   + (double)currentUserWallet * 100_000_000.0
                                   + (double)currentUserCheckoutAmount * 10_000.0;

        // ── 3. Lấy những users có Checkout Intent (đã bấm Mua hàng ngay trong 5 phút)
        var allActiveIntents = new Dictionary<Guid, List<Guid>>();
        foreach (var lid in listingIds)
        {
            var activeUsers = await _queueService.GetActiveCheckoutIntentsAsync(lid);
            // Loại bỏ chính mình ra khỏi danh sách đối thủ
            activeUsers.RemoveAll(u => u == request.UserId);
            activeUsers.RemoveAll(u => u == Guid.Empty); // Thêm check để an toàn
            allActiveIntents[lid] = activeUsers;
        }

        var allOtherUserIdsWithIntent = allActiveIntents.SelectMany(x => x.Value).Distinct().ToList();

        // ── 4. Lấy giỏ hàng của các user đang có intent ──────────────────────
        var otherUserCarts = new List<OtherUserCartItem>();
        if (allOtherUserIdsWithIntent.Any())
        {
            var carts = await _ctx.CartItems
                .Include(ci => ci.Cart)
                .Include(ci => ci.Listing) // cần Listing để tính SalePrice
                .Where(ci => listingIds.Contains(ci.ListingId) && allOtherUserIdsWithIntent.Contains(ci.Cart.UserId))
                .GroupBy(ci => new { ci.ListingId, ci.Cart.UserId, ci.Listing.SalePrice })
                .Select(g => new OtherUserCartItem
                {
                    ListingId = g.Key.ListingId,
                    UserId = g.Key.UserId,
                    Quantity = g.Sum(ci => ci.Quantity),
                    SalePrice = g.Key.SalePrice
                })
                .ToListAsync(cancellationToken);
                
            otherUserCarts.AddRange(carts);
        }

        // ── 5. Tính priority của từng user có intent ──────────────────────────
        Dictionary<Guid, decimal> otherUsersSpent = new();
        if (allOtherUserIdsWithIntent.Any())
        {
            otherUsersSpent = await _ctx.Orders
                .Where(o => allOtherUserIdsWithIntent.Contains(o.UserId) && o.OrderStatus == OrderStatusEnum.Completed)
                .GroupBy(o => o.UserId)
                .Select(g => new { UserId = g.Key, TotalSpent = g.Sum(o => (decimal?)o.TotalAmount) ?? 0m })
                .ToDictionaryAsync(x => x.UserId, x => x.TotalSpent, cancellationToken);
        }

        Dictionary<Guid, decimal> otherUsersWallet = new();
        if (allOtherUserIdsWithIntent.Any())
        {
            otherUsersWallet = await _ctx.CustomerWallets
                .Where(w => allOtherUserIdsWithIntent.Contains(w.UserId))
                .ToDictionaryAsync(w => w.UserId, w => w.Balance, cancellationToken);
        }

        // ── 6. Kiểm tra từng sản phẩm theo priority ──────────────────────────
        var results = new List<CartItemAvailabilityResult>();
        foreach (var ci in cartItems)
        {
            var listing = ci.Listing;

            if (listing.ExpiryDate <= DateTime.UtcNow)
            {
                results.Add(new CartItemAvailabilityResult(
                    ci.Id, ci.ListingId, listing.Title, ci.Quantity,
                    listing.QuantityAvailable, false, "Sản phẩm đã hết hạn."));
                continue;
            }

            // Chỉ lấy các đối thủ có intent cho sản phẩm này
            var activeOpponentsForThisListing = allActiveIntents.GetValueOrDefault(ci.ListingId, new List<Guid>());

            var higherPriorityCompetitors = otherUserCarts
                .Where(c => c.ListingId == ci.ListingId && activeOpponentsForThisListing.Contains(c.UserId))
                .Select(c =>
                {
                    var spent = otherUsersSpent.GetValueOrDefault(c.UserId, 0m);
                    var wallet = otherUsersWallet.GetValueOrDefault(c.UserId, 0m);
                    var checkoutAmount = c.Quantity * c.SalePrice;
                    double priority = (double)spent * 1_000_000_000_000.0 
                                    + (double)wallet * 100_000_000.0 
                                    + (double)checkoutAmount * 10_000.0;
                    return new { Quantity = c.Quantity, Priority = priority };
                })
                .Where(c => c.Priority > currentUserPriority)
                .ToList();

            int higherPriorityDemand = higherPriorityCompetitors.Sum(c => c.Quantity);
            int effectiveAvailable = listing.QuantityAvailable - higherPriorityDemand;
            bool isAvailable = effectiveAvailable >= ci.Quantity;

            string? blockedReason = null;
            if (!isAvailable)
            {
                blockedReason = higherPriorityDemand > 0
                    ? "Sản phẩm đang được giữ chỗ bởi khách hàng ưu tiên cao hơn."
                    : "Sản phẩm không đủ số lượng.";
            }

            results.Add(new CartItemAvailabilityResult(
                CartItemId: ci.Id,
                ListingId: ci.ListingId,
                Title: listing.Title,
                RequestedQuantity: ci.Quantity,
                AvailableQuantity: Math.Max(0, effectiveAvailable),
                IsAvailable: isAvailable,
                BlockedReason: blockedReason
            ));
        }

        var canProceed = results.All(r => r.IsAvailable);
        if (canProceed)
        {
            // Record intent in Redis for 5 minutes
            foreach (var lid in listingIds)
            {
                await _queueService.RecordCheckoutIntentAsync(lid, request.UserId, TimeSpan.FromMinutes(5));
            }
        }

        return new CheckCartAvailabilityResult(
            CanProceed: canProceed,
            Items: results
        );
    }
}
