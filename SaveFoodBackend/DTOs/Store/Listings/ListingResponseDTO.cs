using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Store.Listings;

public class ListingResponseDTO
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Title { get; set; } = null!;
    public decimal SalePrice { get; set; }
    public int QuantityAvailable { get; set; }
    public DateTime ExpiryDate { get; set; }
    public byte Status { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public List<DiscountRuleResponseDTO> DiscountRules { get; set; } = new List<DiscountRuleResponseDTO>();
    public List<ListingImageResponseDTO> Images { get; set; } = new List<ListingImageResponseDTO>();
}

public class DiscountRuleResponseDTO
{
    public Guid Id { get; set; }
    public int RuleOrder { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal? TargetPrice { get; set; }
    public int TriggerValue { get; set; }
    public byte TriggerType { get; set; }
    public bool IsActive { get; set; }
}
