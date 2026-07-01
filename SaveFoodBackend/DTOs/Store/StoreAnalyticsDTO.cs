namespace SaveFoodBackend.DTOs.Store;

public class StoreAnalyticsDTO
{
    public decimal TotalRevenue { get; set; }
    public decimal RevenuePercentageChange { get; set; }
    public int CompletedOrders { get; set; }
    public decimal OrdersPercentageChange { get; set; }
    public string PlanName { get; set; } = "Free";
    public int AnalyticsLevel { get; set; } = 0;
    public List<decimal> WeeklyRevenue { get; set; } = new();
    public List<TopSellingProductDTO> TopSellingProducts { get; set; } = new();
    public double ReturnCustomerRate { get; set; }
    
    // New fields
    public int CancelledOrders { get; set; }
    public int ExpiredOrders { get; set; }
    public List<int> WeeklyCompletedOrders { get; set; } = new();
    public List<int> WeeklyCancelledOrders { get; set; } = new();
    public List<double> WeeklyAverageRating { get; set; } = new();
    
    public decimal PreviousMonthRevenue { get; set; }
    public decimal CurrentMonthRevenue { get; set; }
    
    public int TotalCustomers { get; set; }
    public int ReturningCustomers { get; set; }

    public int PositiveReviews { get; set; }
    public int NeutralReviews { get; set; }
    public int NegativeReviews { get; set; }
}

public class TopSellingProductDTO
{
    public string Name { get; set; } = string.Empty;
    public int Sales { get; set; }
}
