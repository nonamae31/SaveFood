using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Hubs;
using SaveFoodBackend.Application.Orders.Events;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.Orders.Commands;

public record VerifyPickupCommand(Guid OrderId, string PickupCode, Guid UserId) : IRequest<bool>;

public class VerifyPickupCommandHandler : IRequestHandler<VerifyPickupCommand, bool>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IPublisher _publisher;

    public VerifyPickupCommandHandler(SaveFoodDbContext ctx, IHubContext<NotificationHub> hubContext, IPublisher publisher)
    {
        _ctx = ctx;
        _hubContext = hubContext;
        _publisher = publisher;
    }

    public async Task<bool> Handle(VerifyPickupCommand request, CancellationToken cancellationToken)
    {
        var order = await _ctx.Orders
            .Include(o => o.Store)
                .ThenInclude(s => s.StoreStaffs)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new NotFoundException("Đơn hàng không tồn tại.");

        bool isStaff = order.Store.StoreStaffs.Any(s => s.UserId == request.UserId);
        if (!isStaff)
            throw new UnauthorizedException("Bạn không có quyền xác nhận đơn hàng của cửa hàng này.");

        if (order.OrderStatus == OrderStatusEnum.Cancelled)
            throw new BusinessException("Đơn hàng đã bị huỷ.");
        if (order.OrderStatus == OrderStatusEnum.Completed)
            throw new BusinessException("Đơn hàng đã được xác nhận lấy hàng trước đó.");
        
        if (order.PickupCode != request.PickupCode)
            throw new BusinessException("Mã nhận hàng không chính xác.");

        if (order.Payment != null && order.Payment.PaymentMethod == 1 && order.Payment.Status == 0) // PayOS but pending
        {
            throw new BusinessException("Đơn hàng thanh toán online chưa hoàn tất thanh toán. Vui lòng kiểm tra lại.");
        }

        order.OrderStatus = OrderStatusEnum.Completed; // 3
        order.ConfirmedById = request.UserId;

        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, cancellationToken);
        if (storeWallet != null)
        {
            decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
            decimal storeIncome = order.TotalAmount - platformFee;

            storeWallet.AvailableBalance += storeIncome;
            
            if (order.Payment != null && order.Payment.Status == 1) // Paid
            {
                storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);
            }
            
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
        }

        await _ctx.SaveChangesAsync(cancellationToken);

        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusChanged", order.Id, 2, cancellationToken: cancellationToken);

        await _publisher.Publish(new OrderCompletedEvent(order.Id, order.UserId, order.TotalAmount, OrderCompletionSource.StaffScan), cancellationToken);

        return true;
    }
}
