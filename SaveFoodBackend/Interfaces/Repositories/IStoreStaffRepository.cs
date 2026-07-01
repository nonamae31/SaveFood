using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface IStoreStaffRepository
{
    Task<IEnumerable<StoreStaff>> GetByStoreIdAsync(Guid storeId, CancellationToken ct = default);
    Task<StoreStaff?> GetFirstStoreStaffByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<StoreStaff?> GetByStoreAndUserIdAsync(Guid storeId, Guid userId, CancellationToken ct = default);
    Task<int> CountStoresByUserIdAsync(Guid userId, CancellationToken ct = default);
    void Add(StoreStaff storeStaff);
    void Remove(StoreStaff storeStaff);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
