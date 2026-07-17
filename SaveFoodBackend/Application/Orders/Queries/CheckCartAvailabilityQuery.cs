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
/// Kết quả kiểm tra từng item trong giỏ hàng.
/// </summary>
public record CartItemAvailabilityResult(
    Guid CartItemId,
    Guid ListingId,
    string Title,
    int RequestedQuantity,
    int AvailableQuantity,
    bool IsAvailable
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

    public CheckCartAvailabilityQueryHandler(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<CheckCartAvailabilityResult> Handle(
        CheckCartAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        var cartItems = await _ctx.CartItems
            .Include(ci => ci.Listing)
            .Where(ci => request.CartItemIds.Contains(ci.Id) && ci.Cart.UserId == request.UserId)
            .ToListAsync(cancellationToken);

        var results = cartItems.Select(ci => new CartItemAvailabilityResult(
            CartItemId: ci.Id,
            ListingId: ci.ListingId,
            Title: ci.Listing.Title,
            RequestedQuantity: ci.Quantity,
            AvailableQuantity: ci.Listing.QuantityAvailable,
            IsAvailable: ci.Listing.QuantityAvailable >= ci.Quantity
                         && ci.Listing.ExpiryDate > DateTime.UtcNow
        )).ToList();

        return new CheckCartAvailabilityResult(
            CanProceed: results.All(r => r.IsAvailable),
            Items: results
        );
    }
}
