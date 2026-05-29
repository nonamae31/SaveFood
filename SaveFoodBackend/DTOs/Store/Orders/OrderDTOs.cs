using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Store.Orders
{
    /// <summary>Summary row for the store's order list page.</summary>
    public class StoreOrderDTO
    {
        public Guid Id { get; set; }
        public string CustomerName { get; set; } = null!;
        public string CustomerEmail { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public byte OrderStatus { get; set; }
        public string OrderStatusLabel { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public List<StoreOrderItemDTO> Items { get; set; } = new();
    }

    public class StoreOrderItemDTO
    {
        public string ProductName { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
