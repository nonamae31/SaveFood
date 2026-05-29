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

        public async Task<System.Collections.Generic.IEnumerable<SaveFoodBackend.DTOs.Customer.Stores.CustomerStoreDTO>> GetCustomerStoresAsync(System.Threading.CancellationToken ct = default)
        {
            var stores = await _storeRepo.GetActiveStoresAsync(ct);

            // Since we need to randomize those with PriorityLevel 0, we do the order in memory
            var random = new Random();

            var dtos = stores.Select(s =>
            {
                var activeSub = s.StoreSubscriptions?.FirstOrDefault();
                var plan = activeSub?.Plan;
                
                // Determine mock/fallback values for UI display if needed
                var mainCategory = s.Products?.Select(p => p.Category?.Name).FirstOrDefault(c => c != null) ?? "Thực phẩm";

                return new SaveFoodBackend.DTOs.Customer.Stores.CustomerStoreDTO
                {
                    Id = s.Id,
                    Name = s.Name,
                    Category = mainCategory,
                    Rating = Math.Round(s.TrustScore / 20.0, 1),
                    Address = $"{s.AddressLine}, {s.Ward}, {s.District}, {s.City}",
                    ImageUrl = s.LogoUrl ?? "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80",
                    Tags = new System.Collections.Generic.List<string> { "Giải cứu", "Tiết kiệm" },
                    PriorityLevel = plan?.PriorityLevel ?? 0,
                    HasFeaturedBadge = plan?.HasFeaturedBadge ?? false
                };
            }).ToList();

            // Order by PriorityLevel descending, then random order
            return dtos.OrderByDescending(d => d.PriorityLevel).ThenBy(d => random.Next()).ToList();
        }

        public async Task<SaveFoodBackend.DTOs.Customer.Stores.CustomerStoreDetailDTO?> GetCustomerStoreByIdAsync(Guid storeId, System.Threading.CancellationToken ct = default)
        {
            var store = await _storeRepo.GetByIdAsync(storeId, ct);
            if (store == null || store.Status != (byte)StoreStatus.Active)
            {
                return null;
            }

            // Manually fetch subscriptions and products since GetByIdAsync might not include them
            var activeSub = store.StoreSubscriptions?.FirstOrDefault(sub => sub.StartDate <= DateTime.UtcNow && sub.EndDate >= DateTime.UtcNow);
            var plan = activeSub?.Plan;
            var mainCategory = store.Products?.Select(p => p.Category?.Name).FirstOrDefault(c => c != null) ?? "Thực phẩm";

            return new SaveFoodBackend.DTOs.Customer.Stores.CustomerStoreDetailDTO
            {
                Id = store.Id,
                Name = store.Name,
                Category = mainCategory,
                Rating = Math.Round(store.TrustScore / 20.0, 1),
                Address = $"{store.AddressLine}, {store.Ward}, {store.District}, {store.City}",
                ImageUrl = store.LogoUrl ?? "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80",
                Tags = new System.Collections.Generic.List<string> { "Giải cứu", "Tiết kiệm" },
                PriorityLevel = plan?.PriorityLevel ?? 0,
                HasFeaturedBadge = plan?.HasFeaturedBadge ?? false,
                Phone = store.PhoneNumber ?? string.Empty,
                OpeningHours = "07:00 - 22:00", // Not in DB yet
                CoverImage = store.CoverUrl ?? "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80",
                Description = store.Description ?? string.Empty
            };
        }
    }
}
