using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class OrderItem
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public Guid ListingId { get; set; }

    public string ProductNameSnapshot { get; set; } = null!;

    public decimal UnitPriceSnapshot { get; set; }

    public int Quantity { get; set; }

    public virtual ClearanceListing Listing { get; set; } = null!;

    public virtual Order Order { get; set; } = null!;

    public virtual Review? Review { get; set; }
}
