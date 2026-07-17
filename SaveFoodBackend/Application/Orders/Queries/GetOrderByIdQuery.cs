using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.Orders.Queries;

public record GetOrderByIdQuery(Guid Id, Guid UserId) : IRequest<OrderDetailDTO>;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDetailDTO>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly SaveFoodBackend.Interfaces.IJwtProvider _jwtProvider;

    public GetOrderByIdQueryHandler(SaveFoodDbContext ctx, SaveFoodBackend.Interfaces.IJwtProvider jwtProvider)
    {
        _ctx = ctx;
        _jwtProvider = jwtProvider;
    }

    public async Task<OrderDetailDTO> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _ctx.Orders
            .AsNoTracking()
            .Include(o => o.Store)
            .Include(o => o.Payment)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Listing)
                    .ThenInclude(l => l.ListingImages)
            .FirstOrDefaultAsync(o => o.Id == request.Id && o.UserId == request.UserId, cancellationToken);

        if (order == null)
            throw new NotFoundException("Không tìm thấy đơn hàng.");

        return new OrderDetailDTO
        {
            Id = order.Id,
            StoreId = order.StoreId,
            StoreName = order.Store.Name,
            StoreAddress = $"{order.Store.DetailedAddress}, {order.Store.Ward}, {order.Store.City}".Replace(" ,", ",").Trim(',', ' '),
            TotalAmount = order.TotalAmount,
            VoucherDiscount = order.VoucherDiscount,
            OrderStatus = order.OrderStatus,
            CreatedAt = order.CreatedAt,
            PickupCode = order.PickupCode,
            QrToken = _jwtProvider.GenerateQrToken(order.Id),
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
}
