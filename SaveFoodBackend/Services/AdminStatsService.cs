using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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
        var totalRevenue = await _financeRepo.GetTotalPlatformFeeRevenueAsync();
        var monthlyRevenues = await _financeRepo.GetMonthlyPlatformFeeRevenuesAsync();

        // Cửa hàng nhận 95%, hệ thống nhận 5%. Vậy doanh thu ròng của cửa hàng = phí nền tảng * 19
        var totalShopNetRevenue = totalRevenue * 19;

        return new AdminRevenueStatsResponse
        {
            TotalRevenue = totalRevenue,
            TotalShopNetRevenue = totalShopNetRevenue,
            MonthlyRevenues = monthlyRevenues
        };
    }

    public async Task<AdminSubscriptionStatsResponse> GetSubscriptionStatsAsync()
    {
        var currentDate = DateTime.UtcNow;

        var totalActiveSubscriptions = await _subscriptionRepo.GetTotalActiveStoreSubscriptionsAsync(currentDate);
        var totalRevenue = await _subscriptionRepo.GetTotalSubscriptionRevenueAsync();
        var monthlyStats = await _subscriptionRepo.GetMonthlySubscriptionRevenuesAsync();
        var activeSubscriptionsByPlan = await _subscriptionRepo.GetActiveSubscriptionsByPlanAsync(currentDate);

        return new AdminSubscriptionStatsResponse
        {
            TotalActiveSubscriptions = totalActiveSubscriptions,
            TotalSubscriptionRevenue = totalRevenue,
            MonthlyStats = monthlyStats,
            ActiveSubscriptionsByPlan = activeSubscriptionsByPlan
        };
    }
}
