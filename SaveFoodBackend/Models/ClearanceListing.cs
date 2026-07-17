using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class ClearanceListing
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public string Title { get; set; } = null!;

    public decimal SalePrice { get; set; }

    public int QuantityAvailable { get; set; }

    public DateTime ExpiryDate { get; set; }

    public byte Status { get; set; }

    public byte ListingFlags { get; set; }

    public DateTime CreatedAt { get; set; }

    public byte[]? RowVersion { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual ICollection<ListingDiscountRule> ListingDiscountRules { get; set; } = new List<ListingDiscountRule>();

    public virtual ICollection<ListingImage> ListingImages { get; set; } = new List<ListingImage>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual Product Product { get; set; } = null!;
}
