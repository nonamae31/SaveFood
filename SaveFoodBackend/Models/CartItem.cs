using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class CartItem
{
    public Guid Id { get; set; }

    public Guid CartId { get; set; }

    public Guid ListingId { get; set; }

    public int Quantity { get; set; }

    public virtual Cart Cart { get; set; } = null!;

    public virtual ClearanceListing Listing { get; set; } = null!;
}
