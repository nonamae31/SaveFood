using System;
using System.Linq;
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

public record CustomerConfirmReceiptCommand(Guid OrderId, Guid UserId) : IRequest<bool>;

public class CustomerConfirmReceiptCommandHandler : IRequestHandler<CustomerConfirmReceiptCommand, bool>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;

    public CustomerConfirmReceiptCommandHandler(SaveFoodDbContext ctx, IHubContext<NotificationHub> hubContext, INotificationService notificationService)
    {
        _ctx = ctx;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<bool> Handle(CustomerConfirmReceiptCommand request, CancellationToken cancellationToken)
    {
        var order = await _ctx.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.UserId == request.UserId, cancellationToken);

        if (order == null)
            throw new NotFoundException("Đơn hàng không tồn tại.");

        if (order.OrderStatus != OrderStatusEnum.AwaitingCustomerConfirmation)
            throw new BusinessException($"Đơn hàng chưa được cửa hàng quét mã QR xác nhận.");

        order.OrderStatus = OrderStatusEnum.Completed;

        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, cancellationToken);
        if (storeWallet == null)
        {
            storeWallet = new StoreWallet
            {
                Id = Guid.NewGuid(),
                StoreId = order.StoreId,
                AvailableBalance = 0,
                PendingBalance = 0,
                UpdatedAt = DateTime.UtcNow
            };
            _ctx.StoreWallets.Add(storeWallet);
        }

        decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
        decimal storeIncome = order.TotalAmount - platformFee;

        storeWallet.AvailableBalance += storeIncome;
        storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);

        _ctx.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            StoreWalletId = storeWallet.Id,
            OrderId = order.Id,
            Amount = order.TotalAmount,
            Type = 1, // Income
            Status = 1, // Completed
            Description = $"Doanh thu từ đơn hàng {order.OrderCode ?? 0}"
        });

        _ctx.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            StoreWalletId = storeWallet.Id,
            OrderId = order.Id,
            Amount = platformFee,
            Type = 2, // PlatformFee
            Status = 1, // Completed
            Description = $"Phí nền tảng (5%) từ đơn hàng {order.OrderCode ?? 0}"
        });

        await _ctx.SaveChangesAsync(cancellationToken);

        // Notify store staff
        var staffIds = await _ctx.StoreStaffs
            .Where(s => s.StoreId == order.StoreId)
            .Select(s => s.UserId)
            .ToListAsync(cancellationToken);
            
        foreach (var staffId in staffIds)
        {
            await _hubContext.Clients.Group($"User_{staffId}").SendAsync("OrderStatusUpdated", order.Id, (int)order.OrderStatus, cancellationToken: cancellationToken);
            await _notificationService.SendAsync(
                userId: staffId,
                title: "Khách hàng đã xác nhận",
                body: $"Khách hàng đã xác nhận nhận thành công đơn hàng {order.OrderCode}. Doanh thu đã được cộng vào ví cửa hàng.",
                type: "ORDER_STATUS_UPDATE",
                referenceId: order.Id
            );
        }

        return true;
    }
}
