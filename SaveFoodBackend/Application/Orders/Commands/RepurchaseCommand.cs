using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Common.Exceptions;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Application.Orders.Commands;

public record RepurchaseCommand(Guid OrderId, Guid UserId) : IRequest<bool>;

public class RepurchaseCommandHandler : IRequestHandler<RepurchaseCommand, bool>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly ICartService _cartService;

    public RepurchaseCommandHandler(SaveFoodDbContext ctx, ICartService cartService)
    {
        _ctx = ctx;
        _cartService = cartService;
    }

    public async Task<bool> Handle(RepurchaseCommand request, CancellationToken cancellationToken)
    {
        var orderItems = await _ctx.OrderItems
            .Include(oi => oi.Order)
            .Include(oi => oi.Listing)
            .Where(oi => oi.OrderId == request.OrderId && oi.Order.UserId == request.UserId)
            .ToListAsync(cancellationToken);

        if (!orderItems.Any())
            throw new NotFoundException("Đơn hàng không tồn tại hoặc không có sản phẩm.");

        bool anyAdded = false;
        foreach (var item in orderItems)
        {
            if (item.Listing != null && item.Listing.QuantityAvailable > 0 && item.Listing.Status == 1 && item.Listing.ListingFlags == 0 && item.Listing.ExpiryDate > DateTime.UtcNow)
            {
                int qtyToAdd = Math.Min(item.Quantity, item.Listing.QuantityAvailable);
                if (qtyToAdd > 0)
                {
                    var req = new SaveFoodBackend.DTOs.Customer.Carts.AddToCartRequestDTO
                    {
                        ListingId = item.ListingId,
                        Quantity = qtyToAdd
                    };
                    await _cartService.AddToCartAsync(request.UserId, req, cancellationToken);
                    anyAdded = true;
                }
            }
        }

        if (!anyAdded)
        {
            throw new BusinessException("Không có sản phẩm nào trong đơn hàng này còn đủ điều kiện để mua lại (đã hết hạn, hết hàng hoặc đã xóa).");
        }

        return true;
    }
}
