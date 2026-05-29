using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly SaveFoodDbContext _ctx;

    public SubscriptionRepository(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<IEnumerable<SubscriptionPlan>> GetAllActivePlansAsync(CancellationToken ct = default)
    {
        return await _ctx.SubscriptionPlans
            .Where(p => (p.PlanFlags & (byte)PlanFlagsEnum.IsDeleted) == 0)
            .ToListAsync(ct);
    }

    public async Task<SubscriptionPlan?> GetPlanByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _ctx.SubscriptionPlans
            .Where(p => p.Id == id && (p.PlanFlags & (byte)PlanFlagsEnum.IsDeleted) == 0)
            .FirstOrDefaultAsync(ct);
    }

    public void AddPlan(SubscriptionPlan plan)
    {
        _ctx.SubscriptionPlans.Add(plan);
    }

    public void UpdatePlan(SubscriptionPlan plan)
    {
        _ctx.SubscriptionPlans.Update(plan);
    }

    public async Task<int> GetTotalActiveStoreSubscriptionsAsync(DateTime currentDate, CancellationToken ct = default)
    {
        return await _ctx.StoreSubscriptions
            .Where(s => s.StartDate <= currentDate && s.EndDate >= currentDate)
            .CountAsync(ct);
    }

    public async Task<IEnumerable<StoreSubscription>> GetSubscriptionsWithPlansAsync(CancellationToken ct = default)
    {
        return await _ctx.StoreSubscriptions
            .Include(s => s.Plan)
            .ToListAsync(ct);
    }

    public async Task<StoreSubscription?> GetActiveSubscriptionForStoreAsync(Guid storeId, DateTime currentDate, CancellationToken ct = default)
    {
        return await _ctx.StoreSubscriptions
            .Include(s => s.Plan)
            .Where(s => s.StoreId == storeId && s.StartDate <= currentDate && s.EndDate >= currentDate)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }
}
