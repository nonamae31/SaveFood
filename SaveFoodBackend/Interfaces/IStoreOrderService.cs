using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store.Orders;

namespace SaveFoodBackend.Interfaces;

public interface IStoreOrderService
{
    Task<IEnumerable<StoreOrderDTO>> GetStoreOrdersAsync(Guid storeId, Guid userId, CancellationToken ct = default);
    Task ConfirmOrderAsync(Guid orderId, Guid storeId, Guid userId, CancellationToken ct = default);
    Task MarkReadyForPickupAsync(Guid orderId, Guid storeId, Guid userId, CancellationToken ct = default);
    Task CompleteOrderAsync(Guid orderId, Guid storeId, Guid userId, CancellationToken ct = default);
    Task CancelOrderAsync(Guid orderId, Guid storeId, Guid userId, CancellationToken ct = default);
}
