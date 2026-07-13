using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store;

namespace SaveFoodBackend.Interfaces;

public interface IStoreStaffService
{
    Task<IEnumerable<StoreStaffDTO>> GetStoreStaffAsync(Guid storeId, Guid requestingUserId, CancellationToken ct = default);
    Task<StoreStaffDTO> AddStaffAsync(Guid storeId, Guid requestingUserId, AddStoreStaffRequest request, CancellationToken ct = default);
    Task RemoveStaffAsync(Guid storeId, Guid requestingUserId, Guid targetUserId, CancellationToken ct = default);
    Task BatchUpdateRoleAsync(Guid storeId, Guid requestingUserId, BatchUpdateRoleRequest request, CancellationToken ct = default);
    Task BatchRemoveStaffAsync(Guid storeId, Guid requestingUserId, BatchRemoveStaffRequest request, CancellationToken ct = default);
}
