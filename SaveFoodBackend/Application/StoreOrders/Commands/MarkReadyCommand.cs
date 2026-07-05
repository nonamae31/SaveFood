using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Hubs;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Application.StoreOrders.Commands;

public record MarkReadyCommand(Guid OrderId, Guid StoreId, Guid UserId) : IRequest<bool>;

public class MarkReadyCommandHandler : IRequestHandler<MarkReadyCommand, bool>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IStoreRepository _storeRepo;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;

    public MarkReadyCommandHandler(IOrderRepository orderRepo, IStoreRepository storeRepo, IHubContext<NotificationHub> hubContext, INotificationService notificationService)
    {
        _orderRepo = orderRepo;
        _storeRepo = storeRepo;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<bool> Handle(MarkReadyCommand request, CancellationToken cancellationToken)
    {
        var store = await _storeRepo.GetStoreWithStaffsAsync(request.StoreId, cancellationToken);
        if (store == null) throw new NotFoundException("Cửa hàng không tồn tại.");
        if (!store.StoreStaffs.Any(s => s.UserId == request.UserId))
            throw new UnauthorizedException("Bạn không có quyền thực hiện thao tác này.");

        var order = await _orderRepo.GetOrderWithDetailsAsync(request.OrderId, cancellationToken)
            ?? throw new NotFoundException("Đơn hàng không tồn tại.");

        if (order.StoreId != request.StoreId)
            throw new UnauthorizedException("Đơn hàng không thuộc cửa hàng này.");

        if (order.OrderStatus != OrderStatusEnum.Confirmed)
            throw new BusinessException($"Chỉ có thể chuyển sang 'Chờ lấy hàng' từ trạng thái 'Đã xác nhận'.");

        order.OrderStatus = OrderStatusEnum.ReadyForPickup;
        _orderRepo.Update(order);
        await _orderRepo.SaveChangesAsync(cancellationToken);
        
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusUpdated", order.Id, (int)order.OrderStatus, cancellationToken: cancellationToken);
        
        await _notificationService.SendAsync(
            userId: order.UserId,
            title: "Món ăn đã sẵn sàng!",
            body: $"Đơn hàng {order.OrderCode} đã được chuẩn bị xong. Vui lòng đến cửa hàng để lấy món nhé!",
            type: "ORDER_STATUS_UPDATE",
            referenceId: order.Id
        );

        return true;
    }
}
