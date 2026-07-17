using System;
using System.Collections.Generic;
using SaveFoodBackend.DTOs.Store.Listings;

namespace SaveFoodBackend.DTOs.Store.Listings;

/// <summary>
/// Một Discount Rule Template — tập DiscountRule[] từ một Listing cũ của Store.
/// Dùng để load nhanh khi tạo Listing mới.
/// </summary>
public class RuleTemplateDTO
{
    public Guid ListingId { get; set; }
    public string ListingTitle { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public List<DiscountRuleResponseDTO> Rules { get; set; } = new();
}
