using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Store.Listings;

public class CreateListingDTO
{
    [Required]
    public Guid ProductId { get; set; }

    [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
    [MaxLength(255)]
    public string Title { get; set; } = null!;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
    public decimal SalePrice { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
    public int QuantityAvailable { get; set; }

    [Required]
    public DateTime ExpiryDate { get; set; }

    public bool IsAutoRenew { get; set; } = false;

    public List<DiscountRuleDTO> DiscountRules { get; set; } = new List<DiscountRuleDTO>();
}

public class DiscountRuleDTO
{
    [Range(0, 100)]
    public decimal? DiscountPercent { get; set; }
    public decimal? TargetPrice { get; set; }
    
    [Required]
    public int TriggerValue { get; set; }
    
    [Required]
    public byte TriggerType { get; set; } // 0 = TimeBeforeExpiry, 1 = StockRemaining
    
    public int RuleOrder { get; set; }
}
