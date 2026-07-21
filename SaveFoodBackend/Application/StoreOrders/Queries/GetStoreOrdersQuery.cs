using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.DTOs.Store.Orders;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.StoreOrders.Queries;

public record GetStoreOrdersQuery(Guid StoreId, Guid UserId) : IRequest<IEnumerable<StoreOrderDTO>>;

public class GetStoreOrdersQueryHandler : IRequestHandler<GetStoreOrdersQuery, IEnumerable<StoreOrderDTO>>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IStoreRepository _storeRepo;

    public GetStoreOrdersQueryHandler(IOrderRepository orderRepo, IStoreRepository storeRepo)
    {
        _orderRepo = orderRepo;
        _storeRepo = storeRepo;
    }

    private static string GetStatusLabel(OrderStatusEnum status) => status switch
    {
        OrderStatusEnum.Pending                     => "Chờ xác nhận",
        OrderStatusEnum.Confirmed                   => "Đã xác nhận",
        OrderStatusEnum.ReadyForPickup              => "Chờ lấy hàng",
        OrderStatusEnum.Completed                   => "Hoàn thành",
        OrderStatusEnum.Cancelled                   => "Đã hủy",
        OrderStatusEnum.AwaitingCustomerConfirmation => "Chờ khách xác nhận",
        _                                           => "Không rõ"
    };

    public async Task<IEnumerable<StoreOrderDTO>> Handle(GetStoreOrdersQuery request, CancellationToken cancellationToken)
    {
        var store = await _storeRepo.GetStoreWithStaffsAsync(request.StoreId, cancellationToken);
        if (store == null) throw new NotFoundException("Cửa hàng không tồn tại.");
        if (!store.StoreStaffs.Any(s => s.UserId == request.UserId))
            throw new UnauthorizedException("Bạn không có quyền thực hiện thao tác này.");

        var orders = await _orderRepo.GetOrdersByStoreAsync(request.StoreId, cancellationToken);

        return orders.Select(o => new StoreOrderDTO
        {
            Id = o.Id,
            CustomerName  = o.User?.FullName ?? "Khách hàng",
            CustomerEmail = o.User?.Email ?? string.Empty,
            TotalAmount   = o.TotalAmount,
            OrderStatus   = o.OrderStatus,
            OrderStatusLabel = GetStatusLabel(o.OrderStatus),
            CreatedAt     = o.CreatedAt,
            PickupCode    = o.PickupCode,
            OrderCode     = o.OrderCode,
            PaymentMethod = o.Payment?.PaymentMethod,
            PaymentStatus = o.Payment?.Status,
            ExpectedPickupTime = o.ExpectedPickupTime,
            Items = o.OrderItems.Select(i => new StoreOrderItemDTO
            {
                ProductName = i.ProductNameSnapshot,
                Quantity    = i.Quantity,
                UnitPrice   = i.UnitPriceSnapshot
            }).ToList()
        }).ToList();
    }
}
