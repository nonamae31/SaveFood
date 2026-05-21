using System;

namespace SaveFoodBackend.DTOs
{
    public class ProductResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal OriginalPrice { get; set; }
        public decimal DiscountedPrice { get; set; }
        public int StockQuantity { get; set; }
        public DateTime ExpiryDate { get; set; }
    }
}
