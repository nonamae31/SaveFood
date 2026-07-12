using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.DTOs.Store.Orders;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.StoreOrders.Queries;

public record LookupOrderByPickupCodeQuery(Guid StoreId, string PickupCode, Guid UserId) : IRequest<StoreOrderDTO>;

public class LookupOrderByPickupCodeQueryHandler : IRequestHandler<LookupOrderByPickupCodeQuery, StoreOrderDTO>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IStoreRepository _storeRepo;

    public LookupOrderByPickupCodeQueryHandler(IOrderRepository orderRepo, IStoreRepository storeRepo)
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

    public async Task<StoreOrderDTO> Handle(LookupOrderByPickupCodeQuery request, CancellationToken cancellationToken)
    {
        var store = await _storeRepo.GetStoreWithStaffsAsync(request.StoreId, cancellationToken);
        if (store == null) throw new NotFoundException("Cửa hàng không tồn tại.");
        if (!store.StoreStaffs.Any(s => s.UserId == request.UserId))
            throw new UnauthorizedException("Bạn không có quyền thực hiện thao tác này.");

        var order = await _orderRepo.GetOrderByPickupCodeAsync(request.StoreId, request.PickupCode, cancellationToken)
            ?? throw new NotFoundException("Không tìm thấy đơn hàng với mã này.");

        return new StoreOrderDTO
        {
            Id            = order.Id,
            CustomerName  = order.User?.FullName ?? "Khách hàng",
            CustomerEmail = order.User?.Email ?? string.Empty,
            TotalAmount   = order.TotalAmount,
            OrderStatus   = order.OrderStatus,
            OrderStatusLabel = GetStatusLabel(order.OrderStatus),
            CreatedAt     = order.CreatedAt,
            PickupCode    = order.PickupCode,
            OrderCode     = order.OrderCode,
            PaymentMethod = order.Payment?.PaymentMethod,
            PaymentStatus = order.Payment?.Status,
            ExpectedPickupTime = order.ExpectedPickupTime,
            Items = order.OrderItems.Select(i => new StoreOrderItemDTO
            {
                ProductName = i.ProductNameSnapshot,
                Quantity    = i.Quantity,
                UnitPrice   = i.UnitPriceSnapshot
            }).ToList()
        };
    }
}
