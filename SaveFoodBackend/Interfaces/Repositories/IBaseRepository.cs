using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories;

/// <summary>
/// Interface Repository nền tảng dùng chung cho tất cả Entity.
/// Mọi IXxxRepository cụ thể phải kế thừa interface này.
/// Constraint: T phải kế thừa BaseEntity (có Id, CreatedAt, UpdatedAt, IsDeleted).
/// </summary>
public interface IBaseRepository<T> where T : BaseEntity
{
    /// <summary>Lấy entity theo ID. Trả về null nếu không tìm thấy hoặc đã bị xóa mềm.</summary>
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Lấy tất cả entity chưa bị xóa mềm (IsDeleted = false).</summary>
    Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);

    /// <summary>Thêm entity mới vào DbContext (chưa SaveChanges).</summary>
    Task AddAsync(T entity, CancellationToken ct = default);

    /// <summary>Đánh dấu entity là Modified trong DbContext (chưa SaveChanges).</summary>
    void Update(T entity);

    /// <summary>Xóa mềm — set IsDeleted = true (chưa SaveChanges). KHÔNG bao giờ xóa thật.</summary>
    void Delete(T entity);

    /// <summary>Lưu tất cả thay đổi trong DbContext xuống Database.</summary>
    Task<int> SaveChangesAsync(CancellationToken ct = default);

    /// <summary>Kiểm tra entity có tồn tại (và chưa bị xóa mềm) không.</summary>
    Task<bool> ExistsAsync(Guid id, CancellationToken ct = default);
}
