using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class Product
{
    public Guid Id { get; set; }

    public Guid StoreId { get; set; }

    public Guid CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal OriginalPrice { get; set; }

    public byte ProductFlags { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<ClearanceListing> ClearanceListings { get; set; } = new List<ClearanceListing>();

    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

    public virtual Store Store { get; set; } = null!;
}
