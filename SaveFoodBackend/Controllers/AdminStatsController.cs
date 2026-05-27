using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Models.Enums;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SaveFoodBackend.Controllers;

[Route("api/admin/stats")]
[ApiController]
[Authorize(Roles = "ADMIN,Admin")] // Uncomment when authentication is fully ready for admin
public class AdminStatsController : ControllerBase
{
    private readonly SaveFoodDbContext _context;

    public AdminStatsController(SaveFoodDbContext context)
    {
        _context = context;
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<AdminRevenueStatsResponse>> GetRevenueStats()
    {
        // Platform Fee revenue
        var platformFeeTransactions = await _context.WalletTransactions
            .Where(t => t.Type == (byte)TransactionTypeEnum.PlatformFee && t.Status == (byte)TransactionStatusEnum.Completed)
            .ToListAsync();

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

        return Ok(new AdminRevenueStatsResponse
        {
            TotalRevenue = totalRevenue,
            MonthlyRevenues = monthlyRevenues
        });
    }

    [HttpGet("subscriptions")]
    public async Task<ActionResult<AdminSubscriptionStatsResponse>> GetSubscriptionStats()
    {
        // Subscriptions
        var currentDate = DateTime.UtcNow;

        var totalActiveSubscriptions = await _context.StoreSubscriptions
            .Where(s => s.StartDate <= currentDate && s.EndDate >= currentDate)
            .CountAsync();

        var subscriptionsWithPlans = await _context.StoreSubscriptions
            .Include(s => s.Plan)
            .ToListAsync();

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

        return Ok(new AdminSubscriptionStatsResponse
        {
            TotalActiveSubscriptions = totalActiveSubscriptions,
            TotalSubscriptionRevenue = totalRevenue,
            MonthlyStats = monthlyStats,
            ActiveSubscriptionsByPlan = activeSubscriptionsByPlan
        });
    }
}
