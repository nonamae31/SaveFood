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
                AddressLine = s.DetailedAddress + ", " + s.Ward + ", " + s.City,
                PhoneNumber = s.PhoneNumber,
                CreatedAt = s.CreatedAt,
                OwnerName = s.StoreStaffs.Where(ss => ss.StaffRole == ownerStaffRole).Select(ss => ss.User.FullName).FirstOrDefault(),
                OwnerEmail = s.StoreStaffs.Where(ss => ss.StaffRole == ownerStaffRole).Select(ss => ss.User.Email).FirstOrDefault(),
                ReferenceLink = s.ReferenceLink,
                StorefrontImageUrl = s.StorefrontImageUrl
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

    public async Task<IEnumerable<Store>> GetActiveStoresAsync(CancellationToken ct = default)
    {
        return await _set
            .Include(s => s.StoreSubscriptions.Where(sub => sub.StartDate <= DateTime.UtcNow && sub.EndDate >= DateTime.UtcNow))
                .ThenInclude(sub => sub.Plan)
            .Include(s => s.Products)
            .Where(s => (s.Status == (byte)StoreStatus.Active || s.Status == (byte)StoreStatus.Closed) 
                     && ((s.StoreFlags & (byte)StoreFlagsEnum.IsDeleted) == 0))
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public void Update(Store store)
    {
        _set.Update(store);
    }

    public async Task AddAsync(Store store, CancellationToken ct = default)
    {
        await _set.AddAsync(store, ct);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }

    public async Task<Dictionary<Guid, double>> GetAverageRatingsForStoresAsync(IEnumerable<Guid> storeIds, CancellationToken ct = default)
    {
        var ratings = await _ctx.Reviews
            .Where(r => storeIds.Contains(r.OrderItem.Order.StoreId))
            .GroupBy(r => r.OrderItem.Order.StoreId)
            .Select(g => new { StoreId = g.Key, AvgRating = g.Average(r => (double)r.Rating) })
            .ToDictionaryAsync(x => x.StoreId, x => x.AvgRating, ct);
            
        return ratings;
    }

    public async Task<IEnumerable<Store>> GetMyStoreRegistrationsAsync(Guid userId, CancellationToken ct = default)
    {
        return await _ctx.Stores
            .Where(s => s.StoreStaffs.Any(ss => ss.UserId == userId && ss.StaffRole == (byte)StaffRole.Owner))
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<(IEnumerable<AdminStoreListDTO> Items, int TotalCount)> GetAdminStoresAsync(string? search, byte? status, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var query = _set.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(s => s.Name.Contains(search) || 
                                     (s.StoreStaffs.Any(ss => ss.StaffRole == 0 && ss.User.FullName.Contains(search))) || 
                                     (s.StoreStaffs.Any(ss => ss.StaffRole == 0 && ss.User.Email.Contains(search))));
        }

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new AdminStoreListDTO
            {
                Id = s.Id,
                Name = s.Name,
                AddressLine = s.DetailedAddress + ", " + s.Ward + ", " + s.City,
                OwnerName = s.StoreStaffs.Where(ss => ss.StaffRole == 0).Select(ss => ss.User.FullName).FirstOrDefault(),
                OwnerEmail = s.StoreStaffs.Where(ss => ss.StaffRole == 0).Select(ss => ss.User.Email).FirstOrDefault(),
                Status = s.Status,
                AvailableBalance = s.StoreWallet != null ? s.StoreWallet.AvailableBalance : 0,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<AdminStoreDetailsDTO?> GetAdminStoreDetailsAsync(Guid storeId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        return await _set
            .Where(s => s.Id == storeId)
            .Select(s => new AdminStoreDetailsDTO
            {
                Id = s.Id,
                Name = s.Name,
                AddressLine = s.DetailedAddress + ", " + s.Ward + ", " + s.City,
                PhoneNumber = s.PhoneNumber,
                Description = s.Description,
                Status = s.Status,
                StorefrontImageUrl = s.StorefrontImageUrl,
                ReferenceLink = s.ReferenceLink,
                CreatedAt = s.CreatedAt,
                
                OwnerName = s.StoreStaffs.Where(ss => ss.StaffRole == 0).Select(ss => ss.User.FullName).FirstOrDefault(),
                OwnerEmail = s.StoreStaffs.Where(ss => ss.StaffRole == 0).Select(ss => ss.User.Email).FirstOrDefault(),
                OwnerPhone = s.StoreStaffs.Where(ss => ss.StaffRole == 0).Select(ss => ss.User.PhoneNumber).FirstOrDefault(),

                AvailableBalance = s.StoreWallet != null ? s.StoreWallet.AvailableBalance : 0,
                PendingBalance = s.StoreWallet != null ? s.StoreWallet.PendingBalance : 0,

                CurrentPlanName = s.StoreSubscriptions
                    .Where(sub => sub.StartDate <= now && sub.EndDate >= now && sub.Status == 1)
                    .Select(sub => sub.Plan.Name)
                    .FirstOrDefault(),
                PlanExpiryDate = s.StoreSubscriptions
                    .Where(sub => sub.StartDate <= now && sub.EndDate >= now && sub.Status == 1)
                    .Select(sub => (DateTime?)sub.EndDate)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(ct);
    }
}
