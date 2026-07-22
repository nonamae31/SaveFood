using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Hubs;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Application.StoreOrders.Commands;

public record CompleteOrderCommand(Guid OrderId, Guid StoreId, Guid UserId) : IRequest<bool>;

public class CompleteOrderCommandHandler : IRequestHandler<CompleteOrderCommand, bool>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IStoreRepository _storeRepo;
    private readonly IFinanceRepository _financeRepo;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;

    public CompleteOrderCommandHandler(IOrderRepository orderRepo, IStoreRepository storeRepo, IFinanceRepository financeRepo, IHubContext<NotificationHub> hubContext, INotificationService notificationService)
    {
        _orderRepo = orderRepo;
        _storeRepo = storeRepo;
        _financeRepo = financeRepo;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<bool> Handle(CompleteOrderCommand request, CancellationToken cancellationToken)
    {
        var store = await _storeRepo.GetStoreWithStaffsAsync(request.StoreId, cancellationToken);
        if (store == null) throw new NotFoundException("Cửa hàng không tồn tại.");
        if (!store.StoreStaffs.Any(s => s.UserId == request.UserId))
            throw new UnauthorizedException("Bạn không có quyền thực hiện thao tác này.");

        var order = await _orderRepo.GetOrderWithDetailsAsync(request.OrderId, cancellationToken)
            ?? throw new NotFoundException("Đơn hàng không tồn tại.");

        if (order.StoreId != request.StoreId)
            throw new UnauthorizedException("Đơn hàng không thuộc cửa hàng này.");

        if (order.OrderStatus != OrderStatusEnum.ReadyForPickup)
            throw new BusinessException($"Chỉ có thể hoàn thành đơn hàng đang ở trạng thái 'Chờ lấy hàng'.");

        order.OrderStatus = OrderStatusEnum.Completed;

        var storeWallet = await _financeRepo.GetStoreWalletByStoreIdAsync(request.StoreId, cancellationToken);
        if (storeWallet == null)
        {
            storeWallet = new StoreWallet
            {
                Id = Guid.NewGuid(),
                StoreId = request.StoreId,
                AvailableBalance = 0,
                PendingBalance = 0,
                UpdatedAt = DateTime.UtcNow
            };
            _financeRepo.AddStoreWallet(storeWallet);
        }

        decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
        decimal storeIncome = order.TotalAmount - platformFee;

        storeWallet.AvailableBalance += storeIncome;
        storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);

        _financeRepo.AddWalletTransaction(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            StoreWalletId = storeWallet.Id,
            OrderId = order.Id,
            Amount = order.TotalAmount,
            Type = (byte)TransactionTypeEnum.OrderRevenue, // 1
            Status = (byte)TransactionStatusEnum.Completed, // 1
            Description = $"Doanh thu từ đơn hàng {order.OrderCode ?? 0}"
        });

        _financeRepo.AddWalletTransaction(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            StoreWalletId = storeWallet.Id,
            OrderId = order.Id,
            Amount = platformFee,
            Type = (byte)TransactionTypeEnum.PlatformFee, // 2
            Status = (byte)TransactionStatusEnum.Completed, // 1
            Description = $"Phí nền tảng (5%) từ đơn hàng {order.OrderCode ?? 0}"
        });

        _orderRepo.Update(order);
        await _orderRepo.SaveChangesAsync(cancellationToken);
        await _financeRepo.SaveChangesAsync(cancellationToken);
        
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusUpdated", order.Id, (int)order.OrderStatus, cancellationToken: cancellationToken);
        
        await _notificationService.SendAsync(
            userId: order.UserId,
            title: "Đơn hàng đã hoàn thành",
            body: $"Bạn đã nhận thành công đơn hàng {order.OrderCode}. Chúc bạn ngon miệng và cảm ơn bạn đã cùng giải cứu thức ăn!",
            type: "ORDER_STATUS_UPDATE",
            referenceId: order.Id
        );

        return true;
    }
}
