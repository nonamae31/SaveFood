using System;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Store.Products;

public class CreateProductDTO
{
    [Required]
    public Guid CategoryId { get; set; }

    [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
    [MaxLength(255)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Giá gốc phải lớn hơn hoặc bằng 0")]
    public decimal OriginalPrice { get; set; }

    public bool IsSurpriseBag { get; set; } = false;

    public System.Collections.Generic.List<Microsoft.AspNetCore.Http.IFormFile>? Images { get; set; }
}
