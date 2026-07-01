using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.Hubs;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.Orders.Commands;

public record CancelOrderCommand(Guid OrderId, Guid UserId, CancelOrderRequestDTO Request) : IRequest<bool>;

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, bool>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IHubContext<NotificationHub> _hubContext;

    public CancelOrderCommandHandler(SaveFoodDbContext ctx, IHubContext<NotificationHub> hubContext)
    {
        _ctx = ctx;
        _hubContext = hubContext;
    }

    public async Task<bool> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _ctx.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.UserId == request.UserId, cancellationToken);
        
        if (order == null)
            throw new NotFoundException("Không tìm thấy đơn hàng.");

        if (order.OrderStatus != OrderStatusEnum.Confirmed) // 1 = Confirmed/Paid Wait for pickup
            throw new BusinessException("Chỉ có thể hủy đơn hàng đang chờ lấy hàng.");

        if (order.ConfirmedById.HasValue)
            throw new BusinessException("Không thể hủy đơn hàng đã được quán xác nhận hoặc đang chuẩn bị.");

        // Refund 100% to Customer Wallet
        var customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == request.UserId, cancellationToken);
        if (customerWallet == null)
        {
            customerWallet = new CustomerWallet
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Balance = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _ctx.CustomerWallets.Add(customerWallet);
        }

        customerWallet.Balance += order.TotalAmount;
        
        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, cancellationToken);
        if (storeWallet != null)
        {
            decimal platformFee = order.TotalAmount * 0.05m;
            decimal storeIncome = order.TotalAmount - platformFee;
            storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);
        }
        
        _ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
        {
            Id = Guid.NewGuid(),
            CustomerWalletId = customerWallet.Id,
            Amount = order.TotalAmount,
            Type = 3, // Refund
            Status = 1, // Completed
            OrderId = order.Id,
            Description = $"Hoàn tiền đơn hàng {order.OrderCode ?? 0}"
        });

        // Return stock
        foreach (var item in order.OrderItems)
        {
            var listing = await _ctx.ClearanceListings.FindAsync(new object[] { item.ListingId }, cancellationToken);
            if (listing != null)
            {
                listing.QuantityAvailable += item.Quantity;
            }
        }

        order.OrderStatus = OrderStatusEnum.Cancelled; // 4
        await _ctx.SaveChangesAsync(cancellationToken);
        
        var staffIds = await _ctx.StoreStaffs
            .Where(s => s.StoreId == order.StoreId)
            .Select(s => s.UserId)
            .ToListAsync(cancellationToken);
            
        foreach (var staffId in staffIds)
        {
            await _hubContext.Clients.Group($"User_{staffId}").SendAsync("OrderStatusUpdated", order.Id, (int)order.OrderStatus, cancellationToken: cancellationToken);
        }

        return true;
    }
}
