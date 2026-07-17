using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs;

public class ReserveOrderRequest
{
    public List<Guid> CartItemIds { get; set; } = new();
}

public class ReserveOrderResponse
{
    public DateTime ExpiresAt { get; set; }
    public bool Success { get; set; }
}
