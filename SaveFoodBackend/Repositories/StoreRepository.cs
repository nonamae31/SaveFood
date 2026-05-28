using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Repositories;

public class StoreRepository : IStoreRepository
{
    private readonly SaveFoodDbContext _ctx;
    private readonly DbSet<Store> _set;

    public StoreRepository(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
        _set = ctx.Set<Store>();
    }

    public async Task<IEnumerable<AdminStoreApprovalDTO>> GetPendingStoresAsync(CancellationToken ct = default)
    {
        var pendingStatus = (byte)StoreStatus.Pending;
        var ownerStaffRole = (byte)StaffRole.Owner;

        return await _set
            .Where(s => s.Status == pendingStatus)
            .Select(s => new AdminStoreApprovalDTO
            {
                Id = s.Id,
                Name = s.Name,
                AddressLine = s.AddressLine,
                PhoneNumber = s.PhoneNumber,
                CreatedAt = s.CreatedAt,
                OwnerName = s.StoreStaffs.Where(ss => ss.StaffRole == ownerStaffRole).Select(ss => ss.User.FullName).FirstOrDefault(),
                OwnerEmail = s.StoreStaffs.Where(ss => ss.StaffRole == ownerStaffRole).Select(ss => ss.User.Email).FirstOrDefault()
            })
            .OrderBy(s => s.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<Store?> GetStoreWithStaffsAsync(Guid storeId, CancellationToken ct = default)
    {
        return await _set
            .Include(s => s.StoreStaffs)
            .FirstOrDefaultAsync(s => s.Id == storeId, ct);
    }

    public async Task<Store?> GetByIdAsync(Guid storeId, CancellationToken ct = default)
    {
        return await _set.FindAsync(new object[] { storeId }, ct);
    }

    public void Update(Store store)
    {
        _set.Update(store);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }
}
