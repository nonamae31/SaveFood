using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Repositories;

/// <summary>
/// Triển khai BaseRepository dùng chung cho mọi Entity.
/// Cung cấp đầy đủ CRUD + Soft Delete mà không cần viết lại code.
/// 
/// Cách dùng: Kế thừa lớp này trong repository cụ thể.
/// Ví dụ: public class ProductRepository : BaseRepository&lt;Product&gt;, IProductRepository
/// </summary>
public abstract class BaseRepository<T>(SaveFoodDbContext ctx) : IBaseRepository<T>
    where T : BaseEntity
{
    protected readonly SaveFoodDbContext _ctx = ctx;
    private readonly DbSet<T> _set = ctx.Set<T>();

    /// <inheritdoc/>
    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _set.FirstOrDefaultAsync(e => e.Id == id, ct);

    /// <inheritdoc/>
    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
        => await _set.AsNoTracking().ToListAsync(ct);

    /// <inheritdoc/>
    public async Task AddAsync(T entity, CancellationToken ct = default)
        => await _set.AddAsync(entity, ct);

    /// <inheritdoc/>
    public void Update(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _set.Update(entity);
    }

    /// <inheritdoc/>
    /// <remarks>
    /// ⚠️ SOFT DELETE — Không xóa dòng dữ liệu thật.
    /// Chỉ set IsDeleted = true. EF Query Filter sẽ tự lọc ra.
    /// </remarks>
    public void Delete(T entity)
    {
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        _set.Update(entity);
    }

    /// <inheritdoc/>
    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _ctx.SaveChangesAsync(ct);

    /// <inheritdoc/>
    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default)
        => await _set.AnyAsync(e => e.Id == id, ct);

    /// <summary>
    /// Truy cập DbSet để viết query nâng cao trong Repository con.
    /// Chỉ dùng trong class kế thừa. Không expose ra ngoài.
    /// </summary>
    protected IQueryable<T> Query() => _set;

    /// <summary>
    /// Tương tự Query() nhưng bật AsNoTracking — dùng cho GET query (không cần track để update).
    /// </summary>
    protected IQueryable<T> QueryNoTracking() => _set.AsNoTracking();
}
