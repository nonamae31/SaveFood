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
}

public class TopSellingProductDTO
{
    public string Name { get; set; } = string.Empty;
    public int Sales { get; set; }
}
