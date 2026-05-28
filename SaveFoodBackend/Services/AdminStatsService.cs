using System;
using System.Linq;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;

namespace SaveFoodBackend.Services;

public class AdminStatsService : IAdminStatsService
{
    private readonly IFinanceRepository _financeRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;

    public AdminStatsService(IFinanceRepository financeRepo, ISubscriptionRepository subscriptionRepo)
    {
        _financeRepo = financeRepo;
        _subscriptionRepo = subscriptionRepo;
    }

    public async Task<AdminRevenueStatsResponse> GetRevenueStatsAsync()
    {
        var platformFeeTransactions = await _financeRepo.GetPlatformFeeTransactionsAsync();

        var totalRevenue = platformFeeTransactions.Sum(t => t.Amount);

        var monthlyRevenues = platformFeeTransactions
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
            .Select(g => new MonthlyRevenue
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Revenue = g.Sum(t => t.Amount)
            })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToList();

        return new AdminRevenueStatsResponse
        {
            TotalRevenue = totalRevenue,
            MonthlyRevenues = monthlyRevenues
        };
    }

    public async Task<AdminSubscriptionStatsResponse> GetSubscriptionStatsAsync()
    {
        var currentDate = DateTime.UtcNow;

        var totalActiveSubscriptions = await _subscriptionRepo.GetTotalActiveStoreSubscriptionsAsync(currentDate);

        var subscriptionsWithPlans = await _subscriptionRepo.GetSubscriptionsWithPlansAsync();

        var totalRevenue = subscriptionsWithPlans.Sum(s => s.Plan.MonthlyPrice);

        var monthlyStats = subscriptionsWithPlans
            .GroupBy(s => new { s.CreatedAt.Year, s.CreatedAt.Month })
            .Select(g => new MonthlySubscriptionStats
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                NewSubscriptionsCount = g.Count(),
                Revenue = g.Sum(s => s.Plan.MonthlyPrice)
            })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToList();

        var activeSubscriptionsByPlan = subscriptionsWithPlans
            .Where(s => s.StartDate <= currentDate && s.EndDate >= currentDate)
            .GroupBy(s => new { s.Plan.Id, s.Plan.Name })
            .Select(g => new PlanSubscriptionCount
            {
                PlanId = g.Key.Id,
                PlanName = g.Key.Name,
                ActiveCount = g.Count()
            })
            .ToList();

        return new AdminSubscriptionStatsResponse
        {
            TotalActiveSubscriptions = totalActiveSubscriptions,
            TotalSubscriptionRevenue = totalRevenue,
            MonthlyStats = monthlyStats,
            ActiveSubscriptionsByPlan = activeSubscriptionsByPlan
        };
    }
}
