using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Customer.Orders;

public class CheckoutRequestDTO
{
    public List<Guid> CartItemIds { get; set; } = new List<Guid>();
    
    // 0: Pay At Counter, 1: PayOS
    public byte PaymentMethod { get; set; }
}
