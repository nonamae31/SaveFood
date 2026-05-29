using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store.Orders;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services;

public class StoreOrderService : IStoreOrderService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IStoreRepository _storeRepo;

    public StoreOrderService(IOrderRepository orderRepo, IStoreRepository storeRepo)
    {
        _orderRepo = orderRepo;
        _storeRepo = storeRepo;
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
        _orderRepo.Update(order);
        await _orderRepo.SaveChangesAsync(ct);
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
        _orderRepo.Update(order);
        await _orderRepo.SaveChangesAsync(ct);
    }
}
