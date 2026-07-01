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
        return await _ctx.SubscriptionPlans.ToListAsync(ct);
    }

    public async Task<SubscriptionPlan?> GetPlanByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _ctx.SubscriptionPlans
            .Where(p => p.Id == id)
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

    public void AddStoreSubscription(StoreSubscription subscription)
    {
        _ctx.StoreSubscriptions.Add(subscription);
    }

    public async Task<int> GetTotalActiveStoreSubscriptionsAsync(DateTime currentDate, CancellationToken ct = default)
    {
        return await _ctx.StoreSubscriptions
            .Where(s => s.Status == (byte)SubscriptionStatus.Active && s.StartDate <= currentDate && s.EndDate >= currentDate)
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
            .Where(s => s.StoreId == storeId && s.Status == (byte)SubscriptionStatus.Active && s.StartDate <= currentDate && s.EndDate >= currentDate)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<decimal> GetTotalSubscriptionRevenueAsync(CancellationToken ct = default)
    {
        return await _ctx.StoreSubscriptions
            .Include(s => s.Plan)
            .Where(s => s.Status == (byte)SubscriptionStatus.Active || s.Status == (byte)SubscriptionStatus.Expired)
            .SumAsync(s => s.Plan.MonthlyPrice, ct);
    }

    public async Task<List<SaveFoodBackend.DTOs.Admin.MonthlySubscriptionStats>> GetMonthlySubscriptionRevenuesAsync(CancellationToken ct = default)
    {
        return await _ctx.StoreSubscriptions
            .Include(s => s.Plan)
            .Where(s => s.Status == (byte)SubscriptionStatus.Active || s.Status == (byte)SubscriptionStatus.Expired)
            .GroupBy(s => new { s.StartDate.Year, s.StartDate.Month })
            .Select(g => new SaveFoodBackend.DTOs.Admin.MonthlySubscriptionStats
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                NewSubscriptionsCount = g.Count(),
                Revenue = g.Sum(s => s.Plan.MonthlyPrice)
            })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync(ct);
    }

    public async Task<List<SaveFoodBackend.DTOs.Admin.PlanSubscriptionCount>> GetActiveSubscriptionsByPlanAsync(DateTime currentDate, CancellationToken ct = default)
    {
        return await _ctx.StoreSubscriptions
            .Include(s => s.Plan)
            .Where(s => s.StartDate <= currentDate && s.EndDate >= currentDate && s.Status == (byte)SubscriptionStatus.Active)
            .GroupBy(s => new { s.Plan.Id, s.Plan.Name })
            .Select(g => new SaveFoodBackend.DTOs.Admin.PlanSubscriptionCount
            {
                PlanId = g.Key.Id,
                PlanName = g.Key.Name,
                ActiveCount = g.Count()
            })
            .ToListAsync(ct);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }
}
