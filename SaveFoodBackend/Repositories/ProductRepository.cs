using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly SaveFoodDbContext _ctx;
    private readonly DbSet<Product> _set;

    public ProductRepository(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
        _set = ctx.Set<Product>();
    }

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        // Need to check IsDeleted flag which is a property derived from ProductFlags
        // We will fetch and then filter in memory for IsDeleted since it's NotMapped,
        // OR better, we use bitwise operation on ProductFlags in DB.
        // IsDeleted is 1.
        return await _set
            .Include(p => p.ProductImages)
            .Where(p => (p.ProductFlags & 1) == 0) // Not deleted
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<IEnumerable<Product>> GetByStoreIdAsync(Guid storeId, CancellationToken ct = default)
    {
        return await _set
            .Include(p => p.ProductImages)
            .Where(p => p.StoreId == storeId && (p.ProductFlags & 1) == 0)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task AddAsync(Product product, CancellationToken ct = default)
    {
        await _set.AddAsync(product, ct);
    }

    public void Update(Product product)
    {
        _set.Update(product);
    }

    public void Delete(Product product)
    {
        product.IsDeleted = true;
        _set.Update(product);
    }

    public void RemoveImage(ProductImage image)
    {
        _ctx.Set<ProductImage>().Remove(image);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default)
    {
        return await _set.AnyAsync(p => p.Id == id && (p.ProductFlags & 1) == 0, ct);
    }
}
