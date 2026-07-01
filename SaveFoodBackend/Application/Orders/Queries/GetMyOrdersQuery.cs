using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.Common;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Orders.Queries;

public record GetMyOrdersQuery(Guid UserId, int? Status, int Page, int PageSize) : IRequest<PaginatedList<OrderHistoryDTO>>;

public class GetMyOrdersQueryHandler : IRequestHandler<GetMyOrdersQuery, PaginatedList<OrderHistoryDTO>>
{
    private readonly SaveFoodDbContext _ctx;

    public GetMyOrdersQueryHandler(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<PaginatedList<OrderHistoryDTO>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _ctx.Orders
            .AsNoTracking()
            .Include(o => o.Store)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Listing)
                    .ThenInclude(l => l.ListingImages)
            .Where(o => o.UserId == request.UserId);

        if (request.Status.HasValue)
        {
            var statusEnum = (OrderStatusEnum)request.Status.Value;
            query = query.Where(o => o.OrderStatus == statusEnum);
        }

        var totalRecords = await query.CountAsync(cancellationToken);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

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

        return new PaginatedList<OrderHistoryDTO>(data, totalRecords, request.Page, request.PageSize);
    }
}
