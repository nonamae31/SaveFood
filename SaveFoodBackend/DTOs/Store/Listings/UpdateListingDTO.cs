using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Store.Listings;

public class UpdateListingDTO
{
    [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
    [MaxLength(255)]
    public string Title { get; set; } = null!;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
    public decimal SalePrice { get; set; }

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Số lượng không hợp lệ")]
    public int QuantityAvailable { get; set; }

    [Required]
    public DateTime ExpiryDate { get; set; }

    public byte Status { get; set; }

    public List<DiscountRuleDTO> DiscountRules { get; set; } = new List<DiscountRuleDTO>();
}
