using System;

namespace SaveFoodBackend.DTOs.Store.Products;

public class ProductImageResponseDTO
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = null!;
}
