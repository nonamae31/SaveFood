using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface IStoreRepository
{
    Task<IEnumerable<AdminStoreApprovalDTO>> GetPendingStoresAsync(CancellationToken ct = default);
    Task<Store?> GetStoreWithStaffsAsync(Guid storeId, CancellationToken ct = default);
    Task<Store?> GetByIdAsync(Guid storeId, CancellationToken ct = default);
    Task<IEnumerable<Store>> GetActiveStoresAsync(CancellationToken ct = default);
    Task AddAsync(Store store, CancellationToken ct = default);
    void Update(Store store);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task<Dictionary<Guid, double>> GetAverageRatingsForStoresAsync(IEnumerable<Guid> storeIds, CancellationToken ct = default);
}
