using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Common;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Listings;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;

namespace SaveFoodBackend.Services;

public class CustomerListingService : ICustomerListingService
{
    private readonly IListingRepository _listingRepo;
    private readonly SaveFoodDbContext _ctx;
    private readonly IRedisService _redis;

    private static readonly TimeSpan ListingsCacheTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan RecommendationsCacheTtl = TimeSpan.FromMinutes(10);

    public CustomerListingService(IListingRepository listingRepo, SaveFoodDbContext ctx, IRedisService redis)
    {
        _listingRepo = listingRepo;
        _ctx = ctx;
        _redis = redis;
    }

    // ─── Cache key helpers ────────────────────────────────────────────────────

    /// <summary>
    /// Tạo cache key từ các tham số tĩnh (bỏ qua lat/lng/page/pageSize vì chúng per-user).
    /// Distance sort và phân trang được áp dụng in-memory sau khi lấy từ cache.
    /// </summary>
    private static string BuildListingsCacheKey(CustomerListingFilterDTO filter)
    {
        var categoryPart = filter.CategoryIds is { Count: > 0 }
            ? string.Join(",", filter.CategoryIds.OrderBy(x => x))
            : "all";
        var minPrice = filter.MinPrice?.ToString() ?? "any";
        var maxPrice = filter.MaxPrice?.ToString() ?? "any";
        var surpriseBag = filter.IsSurpriseBag?.ToString() ?? "any";
        var sortBy = filter.SortBy ?? "default";
        var search = string.IsNullOrWhiteSpace(filter.SearchQuery) ? "none" : filter.SearchQuery.Trim().ToLower();
        return $"listings:{categoryPart}:{minPrice}:{maxPrice}:{surpriseBag}:{sortBy}:{search}";
    }

    // ─── Distance helpers ─────────────────────────────────────────────────────

    private static double CalculateHaversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double angle) => Math.PI * angle / 180.0;

    // ─── Public methods ───────────────────────────────────────────────────────

    public async Task<PaginatedList<CustomerListingDTO>> GetListingsAsync(CustomerListingFilterDTO filter, CancellationToken ct = default)
    {
        var cacheKey = BuildListingsCacheKey(filter);
        List<CustomerListingDTO> allDtos;

        // 1. Try get full list from cache
        var cached = await _redis.GetAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
        {
            allDtos = JsonSerializer.Deserialize<List<CustomerListingDTO>>(cached) ?? new();
        }
        else
        {
            // 2. Cache miss → query DB
            var listings = await _listingRepo.GetCustomerListingsAsync(
                filter.StoreId,
                filter.CategoryIds,
                filter.MinPrice,
                filter.MaxPrice,
                filter.IsSurpriseBag,
                filter.SortBy,
                filter.SearchQuery,
                ct);

            allDtos = listings.Select(MapToDTO).ToList();

            // 3. Persist to cache (full list, no distance/pagination)
            var serialized = JsonSerializer.Serialize(allDtos);
            await _redis.SetAsync(cacheKey, serialized, ListingsCacheTtl);
        }

        // 4. Apply distance in-memory (per-user, not cached)
        if (filter.UserLat.HasValue && filter.UserLng.HasValue)
        {
            foreach (var dto in allDtos)
            {
                if (dto.StoreLatitude.HasValue && dto.StoreLongitude.HasValue)
                {
                    dto.Distance = Math.Round(
                        CalculateHaversine(filter.UserLat.Value, filter.UserLng.Value,
                            (double)dto.StoreLatitude.Value, (double)dto.StoreLongitude.Value), 1);
                }
            }
        }

        // 5. Apply sort in-memory
        if (filter.SortBy == "distance" && filter.UserLat.HasValue && filter.UserLng.HasValue)
        {
            allDtos = allDtos
                .OrderBy(d => d.Distance.HasValue && d.Distance <= 5 ? 0 : 1)
                .ThenBy(d => d.Distance.HasValue ? 0 : 1)
                .ThenBy(d => d.Distance)
                .ThenByDescending(d => d.PriorityLevel)
                .ToList();
        }
        else
        {
            // Luôn đẩy > 5km xuống cuối (giữ nguyên thứ tự DB trong từng nhóm)
            var within5km = allDtos.Where(d => !d.Distance.HasValue || d.Distance <= 5).ToList();
            var outside5km = allDtos.Where(d => d.Distance.HasValue && d.Distance > 5).ToList();
            allDtos = within5km.Concat(outside5km).ToList();
        }

        // 6. Paginate in-memory
        var totalCount = allDtos.Count;
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 50);
        var items = allDtos.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PaginatedList<CustomerListingDTO>(items, totalCount, page, pageSize);
    }

    public async Task<IEnumerable<CustomerListingDTO>> GetRecommendationsAsync(Guid userId, double? userLat = null, double? userLng = null, CancellationToken ct = default)
    {
        var cacheKey = $"listings:recs:{userId}";
        var cached = await _redis.GetAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
            return JsonSerializer.Deserialize<List<CustomerListingDTO>>(cached) ?? new();

        // Lấy danh sách CategoryId từ lịch sử đơn hàng của User
        var favoriteCategoryIds = await _ctx.Orders
            .Where(o => o.UserId == userId)
            .SelectMany(o => o.OrderItems)
            .Select(oi => oi.Listing.Product.CategoryId)
            .Distinct()
            .ToListAsync(ct);

        IEnumerable<CustomerListingDTO> result;

        if (!favoriteCategoryIds.Any())
        {
            var recentListings = await _listingRepo.GetCustomerListingsAsync(null, null, null, null, null, "expiry_asc", null, ct);
            var recentDtos = recentListings.Take(10).Select(l => 
            {
                var dto = MapToDTO(l);
                if (userLat.HasValue && userLng.HasValue && l.Product.Store.Latitude.HasValue && l.Product.Store.Longitude.HasValue)
                {
                    dto.Distance = Math.Round(CalculateHaversine(userLat.Value, userLng.Value, (double)l.Product.Store.Latitude.Value, (double)l.Product.Store.Longitude.Value), 1);
                }
                return dto;
            });
            return recentDtos;
        }

        // Lấy các tin đăng thuộc danh mục yêu thích
        var recommendedListings = await _ctx.ClearanceListings
            .Include(l => l.Product)
                .ThenInclude(p => p.Store)
                    .ThenInclude(s => s.StoreSubscriptions.Where(sub => sub.Status == (byte)SaveFoodBackend.Models.Enums.SubscriptionStatus.Active && sub.StartDate <= DateTime.UtcNow && sub.EndDate >= DateTime.UtcNow))
                        .ThenInclude(sub => sub.Plan)
            .Include(l => l.Product)
                .ThenInclude(p => p.ProductImages)
            .Include(l => l.ListingImages)
            .Include(l => l.ListingDiscountRules)
            .Where(l => (l.ListingFlags & 1) == 0 && l.Status == (byte)SaveFoodBackend.Models.Enums.ListingStatus.Published && l.ExpiryDate > DateTime.UtcNow && l.Product.Store.Status == (byte)SaveFoodBackend.Models.Enums.StoreStatus.Active)
            .Where(l => favoriteCategoryIds.Contains(l.Product.CategoryId))
            .OrderByDescending(l => l.Product.Store.StoreSubscriptions.Select(s => s.Plan.PriorityLevel).FirstOrDefault())
            .ThenBy(l => l.ExpiryDate)
            .Take(10)
            .AsNoTracking()
            .ToListAsync(ct);

        var dtos = recommendedListings.Select(l => 
        {
            var dto = MapToDTO(l);
            if (userLat.HasValue && userLng.HasValue && l.Product.Store.Latitude.HasValue && l.Product.Store.Longitude.HasValue)
            {
                dto.Distance = Math.Round(CalculateHaversine(userLat.Value, userLng.Value, (double)l.Product.Store.Latitude.Value, (double)l.Product.Store.Longitude.Value), 1);
            }
            return dto;
        });

        return dtos;
    }

    public async Task<CustomerListingDTO?> GetListingByIdAsync(Guid id, double? userLat = null, double? userLng = null, CancellationToken ct = default)
    {
        var listing = await _ctx.ClearanceListings
            .Include(l => l.Product)
                .ThenInclude(p => p.Store)
                    .ThenInclude(s => s.StoreSubscriptions.Where(sub => sub.Status == (byte)SaveFoodBackend.Models.Enums.SubscriptionStatus.Active && sub.StartDate <= DateTime.UtcNow && sub.EndDate >= DateTime.UtcNow))
                        .ThenInclude(sub => sub.Plan)
            .Include(l => l.Product)
                .ThenInclude(p => p.ProductImages)
            .Include(l => l.ListingImages)
            .Where(l => (l.ListingFlags & 1) == 0 && l.Status == (byte)SaveFoodBackend.Models.Enums.ListingStatus.Published && l.Product.Store.Status == (byte)SaveFoodBackend.Models.Enums.StoreStatus.Active)
            .FirstOrDefaultAsync(l => l.Id == id, ct);

        if (listing == null)
            return null;

        var dto = MapToDTO(listing);
        if (userLat.HasValue && userLng.HasValue && listing.Product.Store.Latitude.HasValue && listing.Product.Store.Longitude.HasValue)
        {
            dto.Distance = Math.Round(CalculateHaversine(userLat.Value, userLng.Value, (double)listing.Product.Store.Latitude.Value, (double)listing.Product.Store.Longitude.Value), 1);
        }
        return dto;
    }

    private static CustomerListingDTO MapToDTO(SaveFoodBackend.Models.ClearanceListing l)
    {
        var activeSub = l.Product.Store.StoreSubscriptions?.FirstOrDefault();

        // ─── Tính Sale Milestone ─────────────────────────────────────────────────────
        DateTime? nextMilestoneTime = null;
        decimal? nextMilestonePrice = null;

        if (l.ListingDiscountRules != null && l.ListingDiscountRules.Any())
        {
            var now = DateTime.UtcNow;
            // Chỉ xét TimeBeforeExpiry (TriggerType = 0), loại bỏ đã xóa
            var upcomingRules = l.ListingDiscountRules
                .Where(r => !r.IsDeleted && r.TriggerType == 0)
                .Select(r => new
                {
                    Rule = r,
                    // TriggerValue đơn vị phút
                    MilestoneTime = l.ExpiryDate - TimeSpan.FromMinutes(r.TriggerValue)
                })
                .Where(x => x.MilestoneTime > now) // chưa kích hoạt
                .OrderBy(x => x.MilestoneTime)     // gần nhất trước
                .FirstOrDefault();

            if (upcomingRules != null)
            {
                nextMilestoneTime = upcomingRules.MilestoneTime;
                var rule = upcomingRules.Rule;
                if (rule.TargetPrice.HasValue)
                    nextMilestonePrice = rule.TargetPrice.Value;
                else if (rule.DiscountPercent.HasValue)
                    nextMilestonePrice = Math.Round(l.SalePrice * (1 - rule.DiscountPercent.Value / 100m), 0);
            }
        }

        return new CustomerListingDTO
        {
            Id = l.Id,
            ProductId = l.ProductId,
            StoreId = l.Product.StoreId,
            StoreName = l.Product.Store.Name,
            ProductName = l.Product.Name,
            Title = l.Title,
            OriginalPrice = l.Product.OriginalPrice,
            SalePrice = l.SalePrice,
            QuantityAvailable = l.QuantityAvailable,
            ExpiryDate = l.ExpiryDate,
            IsSurpriseBag = (l.Product.ProductFlags & 4) == 4,
            ImageUrl = l.ListingImages?.FirstOrDefault()?.ImageUrl ?? l.Product.ProductImages?.FirstOrDefault()?.ImageUrl,
            Images = (l.ListingImages != null && l.ListingImages.Any())
                     ? l.ListingImages.Select(i => i.ImageUrl).ToList()
                     : l.Product.ProductImages?.Select(i => i.ImageUrl).ToList() ?? new List<string>(),
            HasFeaturedBadge = activeSub?.Plan?.HasFeaturedBadge ?? false,
            PriorityLevel = activeSub?.Plan?.PriorityLevel ?? 0,
            StoreStatus = l.Product.Store.Status,
            StoreLatitude = l.Product.Store.Latitude,
            StoreLongitude = l.Product.Store.Longitude,
            NextMilestoneTime = nextMilestoneTime,
            NextMilestonePrice = nextMilestonePrice,
        };
    }
}
