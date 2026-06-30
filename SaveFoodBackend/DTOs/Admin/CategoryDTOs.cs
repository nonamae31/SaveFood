using System;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Admin;

/// <summary>
/// DTO trả về thông tin một Danh mục (Category).
/// </summary>
public class CategoryResponseDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public int ProductCount { get; set; }
}

/// <summary>
/// DTO nhận dữ liệu khi Tạo mới hoặc Cập nhật Danh mục.
/// </summary>
public class CategoryRequestDTO
{
    [Required(ErrorMessage = "Tên danh mục là bắt buộc.")]
    [MaxLength(100, ErrorMessage = "Tên danh mục không được vượt quá 100 ký tự.")]
    public string Name { get; set; } = null!;
}
