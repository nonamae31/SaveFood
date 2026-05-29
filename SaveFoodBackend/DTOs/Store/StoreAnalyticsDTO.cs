namespace SaveFoodBackend.DTOs.Store;

public class StoreAnalyticsDTO
{
    public decimal TotalRevenue { get; set; }
    public decimal RevenuePercentageChange { get; set; }
    public int CompletedOrders { get; set; }
    public decimal OrdersPercentageChange { get; set; }
}
