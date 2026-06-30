using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Customer.Orders;

public class CheckoutRequestDTO
{
    public List<Guid> CartItemIds { get; set; } = new List<Guid>();
    
    [Required]
    public byte PaymentMethod { get; set; } // 0: Cash, 1: PayOS
    
    [Required]
    public DateTime ExpectedPickupTime { get; set; }

    [Required]
    public bool AgreedToNoRefundPolicy { get; set; }

    public string? ReturnUrl { get; set; }
    public string? CancelUrl { get; set; }
}
