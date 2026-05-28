using System;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Store.Products;

public class UpdateProductDTO
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

    public bool IsHidden { get; set; } = false;

    public System.Collections.Generic.List<Microsoft.AspNetCore.Http.IFormFile>? NewImages { get; set; }

    public System.Collections.Generic.List<System.Guid>? ImageIdsToRemove { get; set; }
}
