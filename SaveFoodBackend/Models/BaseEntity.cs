namespace SaveFoodBackend.Models;

/// <summary>
/// Lớp nền tảng cho tất cả Entity trong hệ thống SaveFood.
/// MỌI Entity cụ thể (Product, Store, Order...) phải kế thừa lớp này.
/// 
/// Quy tắc SOFT DELETE: Không bao giờ xóa dữ liệu thật.
/// Khi cần "xóa", chỉ đặt IsDeleted = true.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>Primary Key dạng GUID, tự sinh khi tạo mới.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Thời điểm tạo (UTC).</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Thời điểm cập nhật lần cuối (UTC).
    /// SaveFoodDbContext.SaveChangesAsync() sẽ tự cập nhật field này.
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Soft delete flag. Khi = true, entity sẽ bị lọc ra khỏi tất cả query.
    /// KHÔNG BAO GIỜ xóa dòng dữ liệu thật trong DB.
    /// </summary>
    public bool IsDeleted { get; set; } = false;
}
