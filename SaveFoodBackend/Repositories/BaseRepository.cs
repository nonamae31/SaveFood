using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SaveFoodBackend.Repositories
{
    public abstract class BaseRepository<T>(SaveFoodDbContext ctx) : IBaseRepository<T>
        where T : BaseEntity
    {
        protected readonly SaveFoodDbContext _ctx = ctx;
        private readonly DbSet<T> _set = ctx.Set<T>();

        public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => await _set.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, ct);

        public async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
            => await _set.Where(e => !e.IsDeleted).AsNoTracking().ToListAsync(ct);

        public async Task AddAsync(T entity, CancellationToken ct = default)
            => await _set.AddAsync(entity, ct);

        public void Update(T entity) => _set.Update(entity);

        public void Delete(T entity)
        {
            entity.IsDeleted = true;
            _set.Update(entity);
        }

        public async Task<int> SaveChangesAsync(CancellationToken ct = default)
            => await _ctx.SaveChangesAsync(ct);
    }
}
