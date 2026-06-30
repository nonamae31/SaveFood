using System;

namespace SaveFoodBackend.DTOs.Customer.Orders;

public class CheckoutResponseDTO
{
    public Guid OrderId { get; set; }
    public string? PickupCode { get; set; }
    public string? CheckoutUrl { get; set; } // PayOS URL
    public DateTime? ReservationExpiresAt { get; set; }
}
