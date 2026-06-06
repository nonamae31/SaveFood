using System;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using Microsoft.AspNetCore.Http;
using SaveFoodBackend.Models.Enums;
using System.Linq;
using SaveFoodBackend.DTOs.Customer.Stores;

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

            var activeSubscription = await _subscriptionRepo.GetActiveSubscriptionForStoreAsync(storeId, DateTime.UtcNow, ct);
            var planName = activeSubscription?.Plan?.Name ?? "Free";
            var hasCustomBanner = activeSubscription?.Plan?.HasCustomBanner ?? false;

            return new StoreProfileDTO
            {
                Name = store.Name,
                Description = store.Description,
                DetailedAddress = store.DetailedAddress,
                Ward = store.Ward,
                City = store.City,
                PhoneNumber = store.PhoneNumber,
                LogoUrl = store.LogoUrl,
                CoverUrl = store.CoverUrl,
                PlanName = planName,
                HasCustomBanner = hasCustomBanner,
                Latitude = store.Latitude,
                Longitude = store.Longitude
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
            store.DetailedAddress = request.DetailedAddress;
            store.Ward = request.Ward;
            store.City = request.City;
            store.PhoneNumber = request.PhoneNumber;
            
            if (request.Latitude.HasValue) store.Latitude = request.Latitude.Value;
            if (request.Longitude.HasValue) store.Longitude = request.Longitude.Value;

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

        private double CalculateHaversine(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371; // Radius of the earth in km
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c; // Distance in km
        }

        private double ToRadians(double angle)
        {
            return Math.PI * angle / 180.0;
        }

        public async Task<System.Collections.Generic.IEnumerable<SaveFoodBackend.DTOs.Customer.Stores.CustomerStoreDTO>> GetCustomerStoresAsync(CustomerStoreFilterDTO filter, System.Threading.CancellationToken ct = default)
        {
            var stores = await _storeRepo.GetActiveStoresAsync(ct);

            if (!string.IsNullOrEmpty(filter?.SearchQuery))
            {
                var q = filter.SearchQuery.ToLower();
                stores = stores.Where(s => s.Name.ToLower().Contains(q) || s.DetailedAddress.ToLower().Contains(q));
            }

            var random = new Random();
            
            var storeIds = stores.Select(s => s.Id).ToList();
            var averageRatings = await _storeRepo.GetAverageRatingsForStoresAsync(storeIds, ct);

            var dtos = stores.Select(s =>
            {
                var activeSub = s.StoreSubscriptions?.FirstOrDefault();
                var plan = activeSub?.Plan;
                var mainCategory = s.Products?.Select(p => p.Category?.Name).FirstOrDefault(c => c != null) ?? "Thực phẩm";

                double? distance = null;
                if (filter?.UserLat != null && filter?.UserLng != null && s.Latitude != null && s.Longitude != null)
                {
                    distance = CalculateHaversine(filter.UserLat.Value, filter.UserLng.Value, (double)s.Latitude.Value, (double)s.Longitude.Value);
                    distance = Math.Round(distance.Value, 1);
                }

                return new SaveFoodBackend.DTOs.Customer.Stores.CustomerStoreDTO
                {
                    Id = s.Id,
                    Name = s.Name,
                    Category = mainCategory,
                    Rating = averageRatings.ContainsKey(s.Id) ? Math.Round(averageRatings[s.Id], 1) : (double?)null,
                    Address = $"{s.DetailedAddress}, {s.Ward}, {s.City}",
                    ImageUrl = s.LogoUrl ?? "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80",
                    Tags = new System.Collections.Generic.List<string> { "Giải cứu", "Tiết kiệm" },
                    PriorityLevel = plan?.PriorityLevel ?? 0,
                    HasFeaturedBadge = plan?.HasFeaturedBadge ?? false,
                    Distance = distance,
                    Latitude = s.Latitude != null ? (double)s.Latitude.Value : null,
                    Longitude = s.Longitude != null ? (double)s.Longitude.Value : null
                };
            }).ToList();

            if (filter?.RadiusKm != null && filter.RadiusKm > 0)
            {
                dtos = dtos.Where(d => d.Distance == null || d.Distance <= filter.RadiusKm).ToList();
            }

            // Order by distance if available, else by priority then random
            if (filter?.UserLat != null && filter?.UserLng != null)
            {
                return dtos.OrderBy(d => d.Distance.HasValue ? 0 : 1).ThenBy(d => d.Distance).ThenByDescending(d => d.PriorityLevel).ToList();
            }

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

            var averageRatings = await _storeRepo.GetAverageRatingsForStoresAsync(new[] { store.Id }, ct);
            var rating = averageRatings.ContainsKey(store.Id) ? Math.Round(averageRatings[store.Id], 1) : (double?)null;

            return new SaveFoodBackend.DTOs.Customer.Stores.CustomerStoreDetailDTO
            {
                Id = store.Id,
                Name = store.Name,
                Category = mainCategory,
                Rating = rating,
                Address = $"{store.DetailedAddress}, {store.Ward}, {store.City}",
                ImageUrl = store.LogoUrl ?? "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80",
                Tags = new System.Collections.Generic.List<string> { "Giải cứu", "Tiết kiệm" },
                PriorityLevel = plan?.PriorityLevel ?? 0,
                HasFeaturedBadge = plan?.HasFeaturedBadge ?? false,
                Phone = store.PhoneNumber ?? string.Empty,
                OpeningHours = "07:00 - 22:00", // Not in DB yet
                CoverImage = store.CoverUrl ?? "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80",
                Description = store.Description ?? string.Empty,
                Latitude = store.Latitude != null ? (double)store.Latitude.Value : null,
                Longitude = store.Longitude != null ? (double)store.Longitude.Value : null
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
            double returnCustomerRate = 0;
            
            if (analyticsLevel >= 1)
            {
                var weekStart = now.AddDays(-(days - 1)).Date; // Use days parameter
                var weekEnd = now;
                weeklyRevenue = await _orderRepo.GetWeeklyRevenueAsync(storeId, weekStart, weekEnd, ct);
                
                topProducts = await _orderRepo.GetTopSellingProductsAsync(storeId, 3, ct);
            }

            if (analyticsLevel >= 2)
            {
                returnCustomerRate = await _orderRepo.GetReturnCustomerRateAsync(storeId, ct);
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
                TopSellingProducts = topProducts,
                ReturnCustomerRate = returnCustomerRate
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

        public async Task<StoreProfileDTO> RegisterStoreAsync(Guid userId, RegisterStoreRequest request, CancellationToken ct = default)
        {
            var store = new SaveFoodBackend.Models.Store
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                DetailedAddress = request.DetailedAddress,
                Ward = request.Ward,
                City = request.City,
                PhoneNumber = request.PhoneNumber,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                ReferenceLink = request.ReferenceLink,
                Status = (byte)StoreStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                TrustScore = 100, // Default trust score
                StoreWallet = new SaveFoodBackend.Models.StoreWallet
                {
                    Id = Guid.NewGuid(),
                    AvailableBalance = 0,
                    PendingBalance = 0,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            store.StoreStaffs.Add(new SaveFoodBackend.Models.StoreStaff
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                StoreId = store.Id,
                StaffRole = (byte)StaffRole.Owner,
                StaffFlags = (byte)StaffFlagsEnum.IsActive,
                JoinedAt = DateTime.UtcNow
            });

            if (request.StorefrontImage != null)
            {
                var (imageUrl, _) = await _cloudinaryService.UploadImageAsync(request.StorefrontImage);
                store.StorefrontImageUrl = imageUrl;
            }

            if (request.SubscriptionPlanId.HasValue)
            {
                // In a real app we might fetch the plan to set EndDate properly based on BillingCycle.
                // For now, we just create the record. Wait, StoreSubscription has properties.
                store.StoreSubscriptions.Add(new SaveFoodBackend.Models.StoreSubscription
                {
                    Id = Guid.NewGuid(),
                    StoreId = store.Id,
                    PlanId = request.SubscriptionPlanId.Value,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(30), // Example: 30 days
                    Status = 0, // Assuming 0 = Active
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Using standard repository approach
            await _storeRepo.AddAsync(store, ct);
            await _storeRepo.SaveChangesAsync(ct);

            return new StoreProfileDTO
            {
                Name = store.Name,
                Description = store.Description,
                DetailedAddress = store.DetailedAddress,
                Ward = store.Ward,
                City = store.City,
                PhoneNumber = store.PhoneNumber
            };
        }

        public async Task<IEnumerable<MyStoreRegistrationDTO>> GetMyStoreRegistrationsAsync(Guid userId, CancellationToken ct = default)
        {
            var userStores = await _storeRepo.GetMyStoreRegistrationsAsync(userId, ct);
            return userStores.Select(s => new MyStoreRegistrationDTO
            {
                Id = s.Id,
                Name = s.Name,
                DetailedAddress = s.DetailedAddress,
                Status = s.Status,
                RejectReason = s.ReviewNotes,
                CreatedAt = s.CreatedAt
            });
        }
    }
}
