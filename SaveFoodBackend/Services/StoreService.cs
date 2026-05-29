using System;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using Microsoft.AspNetCore.Http;
using SaveFoodBackend.Models.Enums;
using System.Linq;

namespace SaveFoodBackend.Services
{
    public class StoreService : IStoreService
    {
        private readonly IStoreRepository _storeRepo;
        private readonly ICloudinaryService _cloudinaryService;

        public StoreService(IStoreRepository storeRepo, ICloudinaryService cloudinaryService)
        {
            _storeRepo = storeRepo;
            _cloudinaryService = cloudinaryService;
        }

        public async Task UpdateStoreImagesAsync(Guid storeId, Guid userId, UpdateStoreImagesRequest request)
        {
            var store = await _storeRepo.GetStoreWithStaffsAsync(storeId);
            if (store == null)
            {
                throw new InvalidOperationException("Cửa hàng không tồn tại.");
            }

            // Check if user is staff of this store
            var isStaff = store.StoreStaffs.Any(s => s.UserId == userId);
            if (!isStaff)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền thực hiện thao tác này.");
            }

            bool hasChanges = false;

            if (request.Logo != null)
            {
                var (logoUrl, logoCloudinaryId) = await _cloudinaryService.UploadImageAsync(request.Logo, store.LogoCloudinaryId);
                store.LogoUrl = logoUrl;
                store.LogoCloudinaryId = logoCloudinaryId;
                hasChanges = true;
            }

            if (request.Banner != null)
            {
                var (bannerUrl, bannerCloudinaryId) = await _cloudinaryService.UploadImageAsync(request.Banner, store.CoverCloudinaryId);
                store.CoverUrl = bannerUrl;
                store.CoverCloudinaryId = bannerCloudinaryId;
                hasChanges = true;
            }

            if (hasChanges)
            {
                _storeRepo.Update(store);
                await _storeRepo.SaveChangesAsync();
            }
        }
    }
}
