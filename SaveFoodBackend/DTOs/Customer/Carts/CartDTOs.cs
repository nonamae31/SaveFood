using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Customer.Carts;

public class CartItemDTO
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }
    
    // Display Info
    public string Title { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public decimal SalePrice { get; set; }
    public decimal OriginalPrice { get; set; }
    
    // Store Info for Grouping
    public Guid StoreId { get; set; }
    public string StoreName { get; set; } = null!;
    
    // Quantity logic
    public int Quantity { get; set; }
    public int AvailableQuantity { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsExpired => ExpiryDate <= DateTime.UtcNow;
}

public class AddToCartRequestDTO
{
    [Required]
    public Guid ListingId { get; set; }
    
    [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
    public int Quantity { get; set; }
}

public class UpdateCartItemRequestDTO
{
    [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
    public int Quantity { get; set; }
}
