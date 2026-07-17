using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Hubs;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Application.Orders.Commands;

public record ConfirmReceiptCommand(Guid OrderId, Guid UserId) : IRequest<bool>;

public class ConfirmReceiptCommandHandler : IRequestHandler<ConfirmReceiptCommand, bool>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;
    private readonly IPublisher _publisher;

    public ConfirmReceiptCommandHandler(SaveFoodDbContext ctx, IHubContext<NotificationHub> hubContext, INotificationService notificationService, IPublisher publisher)
    {
        _ctx = ctx;
        _hubContext = hubContext;
        _notificationService = notificationService;
        _publisher = publisher;
    }

    public async Task<bool> Handle(ConfirmReceiptCommand request, CancellationToken cancellationToken)
    {
        var order = await _ctx.Orders
            .Include(o => o.Payment)
            .Include(o => o.Store)
                .ThenInclude(s => s.StoreStaffs)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new NotFoundException("Đơn hàng không tồn tại.");

        if (order.UserId != request.UserId)
            throw new UnauthorizedException("Bạn không có quyền xác nhận đơn hàng này.");

        if (order.OrderStatus != OrderStatusEnum.AwaitingCustomerConfirmation)
            throw new BusinessException("Đơn hàng chưa được cửa hàng xác nhận hoặc đã hoàn tất trước đó.");

        order.OrderStatus = OrderStatusEnum.Completed;

        // Process store wallet
        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, cancellationToken);
        if (storeWallet != null)
        {
            decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
            decimal storeIncome = order.TotalAmount - platformFee;

            storeWallet.AvailableBalance += storeIncome;

            if (order.Payment != null && order.Payment.Status == 1)
            {
                storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);
            }

            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = storeWallet.Id,
                OrderId = order.Id,
                Amount = order.TotalAmount,
                Type = 1,
                Status = 1,
                Description = $"Doanh thu từ đơn hàng {order.OrderCode ?? 0}"
            });

            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = storeWallet.Id,
                OrderId = order.Id,
                Amount = platformFee,
                Type = 2,
                Status = 1,
                Description = $"Phí nền tảng (5%) từ đơn hàng {order.OrderCode ?? 0}"
            });
        }

        await _ctx.SaveChangesAsync(cancellationToken);

        // Notify store staff
        foreach (var staff in order.Store.StoreStaffs)
        {
            await _hubContext.Clients.Group($"User_{staff.UserId}").SendAsync("OrderStatusUpdated", order.Id, (int)order.OrderStatus, cancellationToken: cancellationToken);
        }

        // Notify customer
        await _notificationService.SendAsync(
            userId: order.UserId,
            title: "Đơn hàng đã hoàn thành",
            body: $"Cảm ơn bạn đã xác nhận nhận hàng. Chúc bạn ngon miệng!",
            type: "ORDER_STATUS_UPDATE",
            referenceId: order.Id
        );

        await _publisher.Publish(new SaveFoodBackend.Application.Orders.Events.OrderCompletedEvent(order.Id, order.UserId, order.TotalAmount, SaveFoodBackend.Application.Orders.Events.OrderCompletionSource.CustomerScan), cancellationToken);

        return true;
    }
}
