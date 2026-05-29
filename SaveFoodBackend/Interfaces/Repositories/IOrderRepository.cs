using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface IOrderRepository
{
    Task<IEnumerable<Order>> GetOrdersByStoreAsync(Guid storeId, CancellationToken ct = default);
    Task<Order?> GetOrderWithDetailsAsync(Guid orderId, CancellationToken ct = default);
    void Update(Order order);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task<(int count, decimal revenue)> GetStoreAnalyticsByDateRangeAsync(Guid storeId, DateTime startDate, DateTime endDate, CancellationToken ct = default);
}
