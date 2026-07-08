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
        public SaveFoodBackend.Models.Enums.OrderStatusEnum OrderStatus { get; set; }
        public string OrderStatusLabel { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public List<StoreOrderItemDTO> Items { get; set; } = new();

        // Pickup & Payment info — dùng cho Pickup Checkout
        public string? PickupCode { get; set; }
        public long? OrderCode { get; set; }
        public byte? PaymentMethod { get; set; }   // 0=Cash, 1=PayOS
        public byte? PaymentStatus { get; set; }   // 0=Pending, 1=Paid
        public DateTime? ExpectedPickupTime { get; set; }
    }

    public class StoreOrderItemDTO
    {
        public string ProductName { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
