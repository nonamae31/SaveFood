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

public class StoreStaffRepository : IStoreStaffRepository
{
    private readonly SaveFoodDbContext _ctx;
    private readonly DbSet<StoreStaff> _set;

    public StoreStaffRepository(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
        _set = ctx.Set<StoreStaff>();
    }

    public async Task<IEnumerable<StoreStaff>> GetByStoreIdAsync(Guid storeId, CancellationToken ct = default)
    {
        return await _set
            .Include(ss => ss.User)
            .Where(ss => ss.StoreId == storeId)
            .OrderBy(ss => ss.StaffRole)
            .ThenBy(ss => ss.JoinedAt)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<StoreStaff?> GetByStoreAndUserIdAsync(Guid storeId, Guid userId, CancellationToken ct = default)
    {
        return await _set
            .FirstOrDefaultAsync(ss => ss.StoreId == storeId && ss.UserId == userId, ct);
    }

    public async Task<StoreStaff?> GetByIdAsync(Guid staffId, CancellationToken ct = default)
    {
        return await _set.FirstOrDefaultAsync(ss => ss.Id == staffId, ct);
    }

    public async Task<int> CountStoresByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _set.CountAsync(ss => ss.UserId == userId, ct);
    }

    public void Add(StoreStaff storeStaff)
    {
        _set.Add(storeStaff);
    }

    public void Update(StoreStaff storeStaff)
    {
        _set.Update(storeStaff);
    }

    public void Remove(StoreStaff storeStaff)
    {
        _set.Remove(storeStaff);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }
}
