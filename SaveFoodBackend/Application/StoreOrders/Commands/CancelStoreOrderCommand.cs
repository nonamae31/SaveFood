using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Hubs;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.StoreOrders.Commands;

public record CancelStoreOrderCommand(Guid OrderId, Guid StoreId, Guid UserId) : IRequest<bool>;

public class CancelStoreOrderCommandHandler : IRequestHandler<CancelStoreOrderCommand, bool>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IStoreRepository _storeRepo;
    private readonly SaveFoodDbContext _ctx;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;

    public CancelStoreOrderCommandHandler(IOrderRepository orderRepo, IStoreRepository storeRepo, SaveFoodDbContext ctx, IHubContext<NotificationHub> hubContext, INotificationService notificationService)
    {
        _orderRepo = orderRepo;
        _storeRepo = storeRepo;
        _ctx = ctx;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<bool> Handle(CancelStoreOrderCommand request, CancellationToken cancellationToken)
    {
        var store = await _storeRepo.GetStoreWithStaffsAsync(request.StoreId, cancellationToken);
        if (store == null) throw new NotFoundException("Cửa hàng không tồn tại.");
        if (!store.StoreStaffs.Any(s => s.UserId == request.UserId))
            throw new UnauthorizedException("Bạn không có quyền thực hiện thao tác này.");

        var order = await _orderRepo.GetOrderWithDetailsAsync(request.OrderId, cancellationToken)
            ?? throw new NotFoundException("Đơn hàng không tồn tại.");

        if (order.StoreId != request.StoreId)
            throw new UnauthorizedException("Đơn hàng không thuộc cửa hàng này.");

        if (order.OrderStatus != OrderStatusEnum.Pending)
            throw new BusinessException($"Chỉ có thể hủy đơn hàng đang ở trạng thái 'Chờ xác nhận'.");

        order.OrderStatus = OrderStatusEnum.Cancelled;

        if (order.Payment != null && order.Payment.Status == (byte)PaymentStatusEnum.Paid)
        {
            var customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == order.UserId, cancellationToken);
            if (customerWallet == null)
            {
                customerWallet = new CustomerWallet
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserId,
                    Balance = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _ctx.CustomerWallets.Add(customerWallet);
            }

            customerWallet.Balance += order.TotalAmount;
            customerWallet.UpdatedAt = DateTime.UtcNow;

            _ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
            {
                Id = Guid.NewGuid(),
                CustomerWalletId = customerWallet.Id,
                Amount = order.TotalAmount,
                Type = 0, // Refund / Deposit
                Status = 1, // Completed
                OrderId = order.Id,
                CreatedAt = DateTime.UtcNow,
                Description = $"Hoàn tiền cho đơn hàng bị cửa hàng hủy {order.OrderCode ?? 0}"
            });
            await _ctx.SaveChangesAsync(cancellationToken);
        }

        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == request.StoreId, cancellationToken);
        if (storeWallet != null && order.Payment != null && order.Payment.Status == (byte)PaymentStatusEnum.Paid)
        {
            decimal platformFee = order.TotalAmount * 0.05m;
            decimal storeIncome = order.TotalAmount - platformFee;
            storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);
        }

        _orderRepo.Update(order);
        await _orderRepo.SaveChangesAsync(cancellationToken);
        
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusUpdated", order.Id, (int)order.OrderStatus, cancellationToken: cancellationToken);

        await _notificationService.SendAsync(
            userId: order.UserId,
            title: "Đơn hàng bị hủy",
            body: $"Rất tiếc, cửa hàng đã hủy đơn hàng {order.OrderCode} của bạn. Nếu bạn đã thanh toán, tiền đã được hoàn lại vào Ví SaveFood.",
            type: "ORDER_STATUS_UPDATE",
            referenceId: order.Id
        );

        return true;
    }
}
