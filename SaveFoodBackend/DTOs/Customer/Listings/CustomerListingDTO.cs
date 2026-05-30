using System;

namespace SaveFoodBackend.DTOs.Customer.Listings;

public class CustomerListingDTO
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid StoreId { get; set; }
    public string StoreName { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string Title { get; set; } = null!;
    public decimal OriginalPrice { get; set; }
    public decimal SalePrice { get; set; }
    public int QuantityAvailable { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsSurpriseBag { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> Images { get; set; } = new();
    public bool HasFeaturedBadge { get; set; }
    public int PriorityLevel { get; set; }
    public double? Distance { get; set; } // km
}

public class CustomerListingFilterDTO
{
    public Guid? StoreId { get; set; }
    public List<Guid>? CategoryIds { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? IsSurpriseBag { get; set; }
    public string? SortBy { get; set; } // "price_asc", "price_desc", "expiry_asc", "distance"
    public string? SearchQuery { get; set; }
    public double? UserLat { get; set; }
    public double? UserLng { get; set; }
    public double? RadiusKm { get; set; }
}
