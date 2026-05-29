using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.DTOs.Customer.Stores;

namespace SaveFoodBackend.Interfaces
{
    public interface IStoreService
    {
        Task<StoreProfileDTO?> GetStoreDashboardProfileAsync(Guid storeId, Guid userId, CancellationToken ct = default);
        Task UpdateStoreProfileAsync(Guid storeId, Guid userId, UpdateStoreProfileRequest request, CancellationToken ct = default);
        Task UpdateStoreImagesAsync(Guid storeId, Guid userId, UpdateStoreImagesRequest request);
        Task<IEnumerable<CustomerStoreDTO>> GetCustomerStoresAsync(CancellationToken ct = default);
        Task<CustomerStoreDetailDTO?> GetCustomerStoreByIdAsync(Guid storeId, CancellationToken ct = default);
        Task<StoreAnalyticsDTO> GetStoreAnalyticsAsync(Guid storeId, CancellationToken ct = default);
    }
}

