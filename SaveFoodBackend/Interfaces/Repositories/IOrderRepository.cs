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
    Task<List<decimal>> GetWeeklyRevenueAsync(Guid storeId, DateTime startDate, DateTime endDate, CancellationToken ct = default);
    Task<List<SaveFoodBackend.DTOs.Store.TopSellingProductDTO>> GetTopSellingProductsAsync(Guid storeId, int count, CancellationToken ct = default);
    Task<Order?> GetOrderByPickupCodeAsync(Guid storeId, string pickupCode, CancellationToken ct = default);
    Task<bool> HasActiveOrdersAsync(Guid userId, CancellationToken ct = default);
    Task<double> GetReturnCustomerRateAsync(Guid storeId, CancellationToken ct = default);
    Task<decimal> GetPendingRevenueAsync(Guid storeId, CancellationToken ct = default);
    Task<int> GetOrdersCountByStatusAsync(Guid storeId, int status, DateTime startDate, DateTime endDate, CancellationToken ct = default);
    Task<List<int>> GetWeeklyOrdersCountByStatusAsync(Guid storeId, int status, DateTime startDate, DateTime endDate, CancellationToken ct = default);
    Task<List<double>> GetWeeklyAverageRatingAsync(Guid storeId, DateTime startDate, DateTime endDate, CancellationToken ct = default);
    Task<(int TotalCustomers, int ReturningCustomers)> GetCustomerMetricsAsync(Guid storeId, DateTime startDate, DateTime endDate, CancellationToken ct = default);
}
