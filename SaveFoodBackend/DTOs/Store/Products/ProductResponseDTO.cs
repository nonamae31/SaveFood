using System;

namespace SaveFoodBackend.DTOs.Store.Products;

public class ProductResponseDTO
{
    public Guid Id { get; set; }
    public Guid StoreId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal OriginalPrice { get; set; }
    public bool IsHidden { get; set; }
    public bool IsSurpriseBag { get; set; }
    public DateTime CreatedAt { get; set; }
}
