using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Admin;

public class AdminRevenueStatsResponse
{
    public decimal TotalRevenue { get; set; }
    public List<MonthlyRevenue> MonthlyRevenues { get; set; } = new();
}

public class MonthlyRevenue
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Revenue { get; set; }
}

public class AdminSubscriptionStatsResponse
{
    public int TotalActiveSubscriptions { get; set; }
    public decimal TotalSubscriptionRevenue { get; set; }
    public List<MonthlySubscriptionStats> MonthlyStats { get; set; } = new();
    public List<PlanSubscriptionCount> ActiveSubscriptionsByPlan { get; set; } = new();
}

public class MonthlySubscriptionStats
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int NewSubscriptionsCount { get; set; }
    public decimal Revenue { get; set; }
}

public class PlanSubscriptionCount
{
    public Guid PlanId { get; set; }
    public string PlanName { get; set; } = null!;
    public int ActiveCount { get; set; }
}
