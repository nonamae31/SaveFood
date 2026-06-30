using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface ISubscriptionRepository
{
    Task<IEnumerable<SubscriptionPlan>> GetAllActivePlansAsync(CancellationToken ct = default);
    Task<SubscriptionPlan?> GetPlanByIdAsync(Guid id, CancellationToken ct = default);
    void AddPlan(SubscriptionPlan plan);
    void UpdatePlan(SubscriptionPlan plan);
    void AddStoreSubscription(StoreSubscription subscription);
    
    Task<int> GetTotalActiveStoreSubscriptionsAsync(DateTime currentDate, CancellationToken ct = default);
    Task<IEnumerable<StoreSubscription>> GetSubscriptionsWithPlansAsync(CancellationToken ct = default);
    Task<StoreSubscription?> GetActiveSubscriptionForStoreAsync(Guid storeId, DateTime currentDate, CancellationToken ct = default);
    
    Task<decimal> GetTotalSubscriptionRevenueAsync(CancellationToken ct = default);
    Task<List<SaveFoodBackend.DTOs.Admin.MonthlySubscriptionStats>> GetMonthlySubscriptionRevenuesAsync(CancellationToken ct = default);
    Task<List<SaveFoodBackend.DTOs.Admin.PlanSubscriptionCount>> GetActiveSubscriptionsByPlanAsync(DateTime currentDate, CancellationToken ct = default);
    
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
