using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SaveFoodBackend.Data
{
    public class SaveFoodDbContext(DbContextOptions<SaveFoodDbContext> options) : DbContext(options)
    {
        public DbSet<Product> Products => Set<Product>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            // Global soft-delete filter
            builder.Entity<Product>().HasQueryFilter(p => !p.IsDeleted);
        }

        public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            foreach (var entry in ChangeTracker.Entries<BaseEntity>()
                .Where(e => e.State == EntityState.Modified))
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            return await base.SaveChangesAsync(ct);
        }
    }
}
