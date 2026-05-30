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
        private readonly IOrderRepository _orderRepo;
        private readonly ISubscriptionRepository _subscriptionRepo;
        private readonly IPayOSService _payOSService;

        public StoreService(
            IStoreRepository storeRepo, 
            ICloudinaryService cloudinaryService, 
            IOrderRepository orderRepo,
            ISubscriptionRepository subscriptionRepo,
            IPayOSService payOSService)
        {
            _storeRepo = storeRepo;
            _cloudinaryService = cloudinaryService;
            _orderRepo = orderRepo;
            _subscriptionRepo = subscriptionRepo;
            _payOSService = payOSService;
        }

        public async Task<StoreProfileDTO?> GetStoreDashboardProfileAsync(Guid storeId, Guid userId, CancellationToken ct = default)
        {
            var store = await _storeRepo.GetStoreWithStaffsAsync(storeId, ct);
            if (store == null)
                throw new InvalidOperationException("Cửa hàng không tồn tại.");

            var isStaff = store.StoreStaffs.Any(s => s.UserId == userId);
            if (!isStaff)
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập thông tin cửa hàng này.");

            return new StoreProfileDTO
            {
                Name = store.Name,
                Description = store.Description,
                AddressLine = store.AddressLine,
                Ward = store.Ward,
                District = store.District,
                City = store.City,
                PhoneNumber = store.PhoneNumber,
                LogoUrl = store.LogoUrl,
                CoverUrl = store.CoverUrl
            };
        }

        public async Task UpdateStoreProfileAsync(Guid storeId, Guid userId, UpdateStoreProfileRequest request, CancellationToken ct = default)
        {
            var store = await _storeRepo.GetStoreWithStaffsAsync(storeId, ct);
            if (store == null)
                throw new InvalidOperationException("Cửa hàng không tồn tại.");

            var isStaff = store.StoreStaffs.Any(s => s.UserId == userId);
            if (!isStaff)
                throw new UnauthorizedAccessException("Bạn không có quyền thực hiện thao tác này.");

            store.Name = request.Name;
            store.Description = request.Description;
            store.AddressLine = request.AddressLine;
            store.Ward = request.Ward;
            store.District = request.District;
            store.City = request.City;
            store.PhoneNumber = request.PhoneNumber;

            _storeRepo.Update(store);
            await _storeRepo.SaveChangesAsync(ct);
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

        public async Task<StoreAnalyticsDTO> GetStoreAnalyticsAsync(Guid storeId, int days = 7, CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;
            
            var currentStart = now.AddDays(-30);
            var currentEnd = now;
            var (currentCount, currentRevenue) = await _orderRepo.GetStoreAnalyticsByDateRangeAsync(storeId, currentStart, currentEnd, ct);
            
            var previousStart = now.AddDays(-60);
            var previousEnd = currentStart;
            var (previousCount, previousRevenue) = await _orderRepo.GetStoreAnalyticsByDateRangeAsync(storeId, previousStart, previousEnd, ct);
            
            decimal revenueChange = 0;
            if (previousRevenue > 0)
            {
                revenueChange = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
            }
            else if (currentRevenue > 0)
            {
                revenueChange = 100;
            }
            
            decimal orderChange = 0;
            if (previousCount > 0)
            {
                orderChange = ((decimal)(currentCount - previousCount) / previousCount) * 100;
            }
            else if (currentCount > 0)
            {
                orderChange = 100;
            }
            
            var activeSubscription = await _subscriptionRepo.GetActiveSubscriptionForStoreAsync(storeId, now, ct);
            string planName = activeSubscription?.Plan?.Name ?? "Free";
            int analyticsLevel = activeSubscription?.Plan?.AnalyticsLevel ?? 0;

            List<decimal> weeklyRevenue = new();
            List<TopSellingProductDTO> topProducts = new();
            
            if (analyticsLevel >= 1)
            {
                var weekStart = now.AddDays(-(days - 1)).Date; // Use days parameter
                var weekEnd = now;
                weeklyRevenue = await _orderRepo.GetWeeklyRevenueAsync(storeId, weekStart, weekEnd, ct);
                
                topProducts = await _orderRepo.GetTopSellingProductsAsync(storeId, 3, ct);
            }

            return new StoreAnalyticsDTO
            {
                TotalRevenue = currentRevenue,
                RevenuePercentageChange = Math.Round(revenueChange, 1),
                CompletedOrders = currentCount,
                OrdersPercentageChange = Math.Round(orderChange, 1),
                PlanName = planName,
                AnalyticsLevel = analyticsLevel,
                WeeklyRevenue = weeklyRevenue,
                TopSellingProducts = topProducts
            };
        }

        public async Task<SubscriptionCheckoutResponse> CreateSubscriptionCheckoutAsync(Guid storeId, Guid userId, SubscriptionCheckoutRequest request, CancellationToken ct = default)
        {
            var store = await _storeRepo.GetStoreWithStaffsAsync(storeId, ct);
            if (store == null) throw new InvalidOperationException("Cửa hàng không tồn tại.");

            var isStaff = store.StoreStaffs.Any(s => s.UserId == userId);
            if (!isStaff) throw new UnauthorizedAccessException("Bạn không có quyền truy cập cửa hàng này.");

            var plan = await _subscriptionRepo.GetPlanByIdAsync(request.PlanId, ct);
            if (plan == null) throw new InvalidOperationException("Gói đăng ký không tồn tại.");

            decimal price = 0;
            int months = 1;
            if (request.BillingCycle == "monthly") { price = plan.MonthlyPrice; months = 1; }
            else if (request.BillingCycle == "semiannual") { price = plan.MonthlyPrice * 6 * 0.9m; months = 6; }
            else if (request.BillingCycle == "annual") { price = plan.MonthlyPrice * 10; months = 12; }

            if (price <= 0)
                throw new InvalidOperationException("Gói này là miễn phí, không cần thanh toán.");

            long orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            var subscription = new SaveFoodBackend.Models.StoreSubscription
            {
                Id = Guid.NewGuid(),
                StoreId = storeId,
                PlanId = request.PlanId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(months),
                Status = 0, // Pending
                CreatedAt = DateTime.UtcNow,
                OrderCode = orderCode
            };

            _subscriptionRepo.AddStoreSubscription(subscription);
            await _subscriptionRepo.SaveChangesAsync(ct);

            string description = $"Mua goi {plan.Name}".PadRight(0).Substring(0, Math.Min(25, $"Mua goi {plan.Name}".Length));
            
            string dashboardUrl = "http://localhost:5173/dashboard/subscription";
            var payOSResponse = await _payOSService.CreatePaymentLink(
                orderCode, 
                price, 
                description, 
                subscription.Id.ToString(), 
                dashboardUrl, // returnUrl
                dashboardUrl  // cancelUrl
            );

            return new SubscriptionCheckoutResponse
            {
                SubscriptionId = subscription.Id,
                CheckoutUrl = payOSResponse.CheckoutUrl
            };
        }
    }
}
