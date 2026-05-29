using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Repositories;

public class ListingRepository : IListingRepository
{
    private readonly SaveFoodDbContext _ctx;
    private readonly DbSet<ClearanceListing> _set;

    public ListingRepository(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
        _set = ctx.Set<ClearanceListing>();
    }

    public async Task<ClearanceListing?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _set
            .Include(l => l.ListingImages)
            .Where(l => (l.ListingFlags & 1) == 0) // IsDeleted = 1
            .FirstOrDefaultAsync(l => l.Id == id, ct);
    }

    public async Task<ClearanceListing?> GetByIdWithRulesAsync(Guid id, CancellationToken ct = default)
    {
        return await _set
            .Include(l => l.ListingDiscountRules.Where(r => (r.RuleFlags & 2) == 0)) // Rule IsDeleted = 2
            .Include(l => l.ListingImages)
            .Include(l => l.Product)
            .Where(l => (l.ListingFlags & 1) == 0)
            .FirstOrDefaultAsync(l => l.Id == id, ct);
    }

    public async Task<IEnumerable<ClearanceListing>> GetByStoreIdAsync(Guid storeId, CancellationToken ct = default)
    {
        return await _set
            .Include(l => l.Product)
            .Include(l => l.ListingDiscountRules.Where(r => (r.RuleFlags & 2) == 0))
            .Include(l => l.ListingImages)
            .Where(l => l.Product.StoreId == storeId && (l.ListingFlags & 1) == 0)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<int> GetActiveListingsCountByStoreAsync(Guid storeId, CancellationToken ct = default)
    {
        return await _set
            .Include(l => l.Product)
            .Where(l => l.Product.StoreId == storeId && (l.ListingFlags & 1) == 0 && l.Status == (byte)ListingStatus.Published)
            .CountAsync(ct);
    }

    public async Task<IEnumerable<ClearanceListing>> GetAllActiveListingsAsync(CancellationToken ct = default)
    {
        return await _set
            .Include(l => l.Product)
            .Include(l => l.ListingDiscountRules.Where(r => (r.RuleFlags & 2) == 0))
            .Include(l => l.ListingImages)
            .Where(l => (l.ListingFlags & 1) == 0 && l.Status == (byte)ListingStatus.Published)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<ClearanceListing>> GetCustomerListingsAsync(Guid? storeId, List<Guid>? categoryIds, decimal? minPrice, decimal? maxPrice, bool? isSurpriseBag, string? sortBy, CancellationToken ct = default)
    {
        var query = _set
            .Include(l => l.Product)
                .ThenInclude(p => p.Store)
                    .ThenInclude(s => s.StoreSubscriptions.Where(sub => sub.StartDate <= DateTime.UtcNow && sub.EndDate >= DateTime.UtcNow))
                        .ThenInclude(sub => sub.Plan)
            .Include(l => l.Product)
                .ThenInclude(p => p.ProductImages)
            .Include(l => l.ListingImages)
            .Where(l => (l.ListingFlags & 1) == 0 && l.Status == (byte)ListingStatus.Published && l.ExpiryDate > DateTime.UtcNow);

        if (storeId.HasValue)
        {
            query = query.Where(l => l.Product.StoreId == storeId.Value);
        }

        if (categoryIds != null && categoryIds.Any())
        {
            query = query.Where(l => categoryIds.Contains(l.Product.CategoryId));
        }

        if (minPrice.HasValue)
        {
            query = query.Where(l => l.SalePrice >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(l => l.SalePrice <= maxPrice.Value);
        }

        if (isSurpriseBag.HasValue)
        {
            // IsSurpriseBag là cờ 4 trong ProductFlags
            if (isSurpriseBag.Value)
            {
                query = query.Where(l => (l.Product.ProductFlags & 4) == 4);
            }
            else
            {
                query = query.Where(l => (l.Product.ProductFlags & 4) == 0);
            }
        }

        query = sortBy switch
        {
            "price_asc" => query.OrderByDescending(l => l.Product.Store.StoreSubscriptions.Select(s => s.Plan.PriorityLevel).FirstOrDefault()).ThenBy(l => l.SalePrice),
            "price_desc" => query.OrderByDescending(l => l.Product.Store.StoreSubscriptions.Select(s => s.Plan.PriorityLevel).FirstOrDefault()).ThenByDescending(l => l.SalePrice),
            "expiry_asc" => query.OrderByDescending(l => l.Product.Store.StoreSubscriptions.Select(s => s.Plan.PriorityLevel).FirstOrDefault()).ThenBy(l => l.ExpiryDate),
            _ => query.OrderByDescending(l => l.Product.Store.StoreSubscriptions.Select(s => s.Plan.PriorityLevel).FirstOrDefault()).ThenBy(l => l.ExpiryDate) // default
        };

        return await query.AsNoTracking().ToListAsync(ct);
    }

    public async Task AddAsync(ClearanceListing listing, CancellationToken ct = default)
    {
        await _set.AddAsync(listing, ct);
    }

    public void Update(ClearanceListing listing)
    {
        _set.Update(listing);
    }

    public void Delete(ClearanceListing listing)
    {
        listing.IsDeleted = true;
        _set.Update(listing);
    }

    public void RemoveImage(ListingImage image)
    {
        _ctx.Set<ListingImage>().Remove(image);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }
}
