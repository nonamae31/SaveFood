using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Customer.Orders;

public class OrderHistoryDTO
{
    public Guid Id { get; set; }
    public Guid StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal VoucherDiscount { get; set; }
    public SaveFoodBackend.Models.Enums.OrderStatusEnum OrderStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // For the list view, we just need one thumbnail or a few items
    public string? FirstItemImageUrl { get; set; }
    public int TotalItems { get; set; }
    public byte PaymentMethod { get; set; }
    public byte? PaymentStatus { get; set; }
    public DateTime? ReservationExpiresAt { get; set; }
}

public class OrderDetailDTO
{
    public Guid Id { get; set; }
    public Guid StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string StoreAddress { get; set; } = string.Empty;
    
    public decimal TotalAmount { get; set; }
    public decimal VoucherDiscount { get; set; }
    public SaveFoodBackend.Models.Enums.OrderStatusEnum OrderStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public string? PickupCode { get; set; }
    public long? OrderCode { get; set; }
    public DateTime? ReservationExpiresAt { get; set; }
    public DateTime? ExpectedPickupTime { get; set; }
    public Guid? ConfirmedById { get; set; }

    public OrderPaymentDTO? Payment { get; set; }
    
    public List<OrderLineItemDTO> Items { get; set; } = new();
}


public class ExtendPickupRequestDTO
{
    public int AdditionalMinutes { get; set; }
}

public class CancelOrderRequestDTO
{
    public string Reason { get; set; } = string.Empty;
}

public class OrderLineItemDTO
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class OrderPaymentDTO
{
    public byte PaymentMethod { get; set; }
    public byte Status { get; set; }
    public DateTime? PaidAt { get; set; }
}
