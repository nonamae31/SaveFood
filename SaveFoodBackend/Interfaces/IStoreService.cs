using System;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store;

namespace SaveFoodBackend.Interfaces
{
    public interface IStoreService
    {
        Task UpdateStoreImagesAsync(Guid storeId, Guid userId, UpdateStoreImagesRequest request);
    }
}
