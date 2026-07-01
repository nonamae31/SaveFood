using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store.Orders;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Models;
using SaveFoodBackend.Hubs;
using SaveFoodBackend.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace SaveFoodBackend.Services;

public class StoreOrderService : IStoreOrderService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IStoreRepository _storeRepo;
    private readonly IFinanceRepository _financeRepo;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly SaveFoodDbContext _ctx;

    public StoreOrderService(IOrderRepository orderRepo, IStoreRepository storeRepo, IFinanceRepository financeRepo, IHubContext<NotificationHub> hubContext, SaveFoodDbContext ctx)
    {
        _orderRepo = orderRepo;
        _storeRepo = storeRepo;
        _financeRepo = financeRepo;
        _hubContext = hubContext;
        _ctx = ctx;
    }

    private static string GetStatusLabel(byte status) => (OrderStatusEnum)status switch
    {
        OrderStatusEnum.Pending        => "Chờ xác nhận",
        OrderStatusEnum.Confirmed      => "Đã xác nhận",
        OrderStatusEnum.ReadyForPickup => "Chờ lấy hàng",
        OrderStatusEnum.Completed      => "Hoàn thành",
        OrderStatusEnum.Cancelled      => "Đã hủy",
        _                              => "Không rõ"
    };

    private async Task EnsureStaffAccess(Guid storeId, Guid userId, CancellationToken ct)
    {
        var store = await _storeRepo.GetStoreWithStaffsAsync(storeId, ct);
        if (store == null) throw new InvalidOperationException("Cửa hàng không tồn tại.");
        if (!store.StoreStaffs.Any(s => s.UserId == userId))
            throw new UnauthorizedAccessException("Bạn không có quyền thực hiện thao tác này.");
    }

    public async Task<IEnumerable<StoreOrderDTO>> GetStoreOrdersAsync(Guid storeId, Guid userId, CancellationToken ct = default)
    {
        await EnsureStaffAccess(storeId, userId, ct);

        var orders = await _orderRepo.GetOrdersByStoreAsync(storeId, ct);

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
            Items = o.OrderItems.Select(i => new StoreOrderItemDTO
            {
                ProductName = i.ProductNameSnapshot,
                Quantity    = i.Quantity,
                UnitPrice   = i.UnitPriceSnapshot
            }).ToList()
        }).ToList();
    }

    public async Task ConfirmOrderAsync(Guid orderId, Guid storeId, Guid userId, CancellationToken ct = default)
    {
        await EnsureStaffAccess(storeId, userId, ct);

        var order = await _orderRepo.GetOrderWithDetailsAsync(orderId, ct)
            ?? throw new InvalidOperationException("Đơn hàng không tồn tại.");

        if (order.StoreId != storeId)
            throw new UnauthorizedAccessException("Đơn hàng không thuộc cửa hàng này.");

        if (order.OrderStatus != (byte)OrderStatusEnum.Pending)
            throw new InvalidOperationException($"Chỉ có thể xác nhận đơn hàng đang ở trạng thái 'Chờ xác nhận'. Trạng thái hiện tại: {GetStatusLabel(order.OrderStatus)}.");

        order.OrderStatus    = (byte)OrderStatusEnum.Confirmed;
        order.ConfirmedById  = userId;
        _orderRepo.Update(order);
        await _orderRepo.SaveChangesAsync(ct);
        
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusUpdated", order.Id, order.OrderStatus, cancellationToken: ct);
    }

    public async Task MarkReadyForPickupAsync(Guid orderId, Guid storeId, Guid userId, CancellationToken ct = default)
    {
        await EnsureStaffAccess(storeId, userId, ct);

        var order = await _orderRepo.GetOrderWithDetailsAsync(orderId, ct)
            ?? throw new InvalidOperationException("Đơn hàng không tồn tại.");

        if (order.StoreId != storeId)
            throw new UnauthorizedAccessException("Đơn hàng không thuộc cửa hàng này.");

        if (order.OrderStatus != (byte)OrderStatusEnum.Confirmed)
            throw new InvalidOperationException($"Chỉ có thể chuyển sang 'Chờ lấy hàng' từ trạng thái 'Đã xác nhận'. Trạng thái hiện tại: {GetStatusLabel(order.OrderStatus)}.");

        order.OrderStatus = (byte)OrderStatusEnum.ReadyForPickup;
        _orderRepo.Update(order);
        await _orderRepo.SaveChangesAsync(ct);
        
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusUpdated", order.Id, order.OrderStatus, cancellationToken: ct);
    }

    public async Task CompleteOrderAsync(Guid orderId, Guid storeId, Guid userId, CancellationToken ct = default)
    {
        await EnsureStaffAccess(storeId, userId, ct);

        var order = await _orderRepo.GetOrderWithDetailsAsync(orderId, ct)
            ?? throw new InvalidOperationException("Đơn hàng không tồn tại.");

        if (order.StoreId != storeId)
            throw new UnauthorizedAccessException("Đơn hàng không thuộc cửa hàng này.");

        if (order.OrderStatus != (byte)OrderStatusEnum.ReadyForPickup)
            throw new InvalidOperationException($"Chỉ có thể hoàn thành đơn hàng đang ở trạng thái 'Chờ lấy hàng'. Trạng thái hiện tại: {GetStatusLabel(order.OrderStatus)}.");

        order.OrderStatus = (byte)OrderStatusEnum.Completed;

        // Process store wallet (add money to store - minus 5% platform fee)
        var storeWallet = await _financeRepo.GetStoreWalletByStoreIdAsync(storeId, ct);
        if (storeWallet == null)
        {
            storeWallet = new StoreWallet
            {
                Id = Guid.NewGuid(),
                StoreId = storeId,
                AvailableBalance = 0,
                PendingBalance = 0,
                UpdatedAt = DateTime.UtcNow
            };
            _financeRepo.AddStoreWallet(storeWallet);
        }

        decimal platformFee = order.TotalAmount * 0.05m;
        decimal storeIncome = order.TotalAmount - platformFee;

        storeWallet.AvailableBalance += storeIncome;
        storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);

        // Log Shop Income (Full Amount)
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

        // Log Platform Fee Deduction (5%)
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
        await _orderRepo.SaveChangesAsync(ct);
        await _financeRepo.SaveChangesAsync(ct);
        
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusUpdated", order.Id, order.OrderStatus, cancellationToken: ct);
    }

    public async Task CancelOrderAsync(Guid orderId, Guid storeId, Guid userId, CancellationToken ct = default)
    {
        await EnsureStaffAccess(storeId, userId, ct);

        var order = await _orderRepo.GetOrderWithDetailsAsync(orderId, ct)
            ?? throw new InvalidOperationException("Đơn hàng không tồn tại.");

        if (order.StoreId != storeId)
            throw new UnauthorizedAccessException("Đơn hàng không thuộc cửa hàng này.");

        if (order.OrderStatus != (byte)OrderStatusEnum.Pending)
            throw new InvalidOperationException($"Chỉ có thể hủy đơn hàng đang ở trạng thái 'Chờ xác nhận'. Trạng thái hiện tại: {GetStatusLabel(order.OrderStatus)}.");

        order.OrderStatus = (byte)OrderStatusEnum.Cancelled;

        // Process Refund if paid
        if (order.Payment != null && order.Payment.Status == (byte)PaymentStatusEnum.Paid)
        {
            var customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == order.UserId, ct);
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
            await _ctx.SaveChangesAsync(ct);
        }

        var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == storeId, ct);
        if (storeWallet != null && order.Payment != null && order.Payment.Status == (byte)PaymentStatusEnum.Paid)
        {
            decimal platformFee = order.TotalAmount * 0.05m;
            decimal storeIncome = order.TotalAmount - platformFee;
            storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);
        }

        _orderRepo.Update(order);
        await _orderRepo.SaveChangesAsync(ct);
        
        await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusUpdated", order.Id, order.OrderStatus, cancellationToken: ct);
    }

    public async Task<StoreOrderDTO> LookupOrderByPickupCodeAsync(Guid storeId, string pickupCode, Guid userId, CancellationToken ct = default)
    {
        await EnsureStaffAccess(storeId, userId, ct);

        var order = await _orderRepo.GetOrderByPickupCodeAsync(storeId, pickupCode, ct)
            ?? throw new InvalidOperationException("Không tìm thấy đơn hàng với mã này.");

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
            Items = order.OrderItems.Select(i => new StoreOrderItemDTO
            {
                ProductName = i.ProductNameSnapshot,
                Quantity    = i.Quantity,
                UnitPrice   = i.UnitPriceSnapshot
            }).ToList()
        };
    }
}
