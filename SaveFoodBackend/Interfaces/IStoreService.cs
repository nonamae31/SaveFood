using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.DTOs.Customer.Stores;

namespace SaveFoodBackend.Interfaces
{
    public interface IStoreService
    {
        Task UpdateStoreImagesAsync(Guid storeId, Guid userId, UpdateStoreImagesRequest request);
        Task<IEnumerable<CustomerStoreDTO>> GetCustomerStoresAsync(CancellationToken ct = default);
        Task<CustomerStoreDetailDTO?> GetCustomerStoreByIdAsync(Guid storeId, CancellationToken ct = default);
    }
}
