using System;

namespace SaveFoodBackend.DTOs
{
    public class CreateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal OriginalPrice { get; set; }
        public decimal DiscountedPrice { get; set; }
        public int StockQuantity { get; set; }
        public DateTime ExpiryDate { get; set; }
    }
}
