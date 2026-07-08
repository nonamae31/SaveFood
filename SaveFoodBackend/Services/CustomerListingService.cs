using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Listings;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;

namespace SaveFoodBackend.Services;

public class CustomerListingService : ICustomerListingService
{
    private readonly IListingRepository _listingRepo;
    private readonly SaveFoodDbContext _ctx;

    public CustomerListingService(IListingRepository listingRepo, SaveFoodDbContext ctx)
    {
        _listingRepo = listingRepo;
        _ctx = ctx;
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
        return R * c;
    }

    private double ToRadians(double angle)
    {
        return Math.PI * angle / 180.0;
    }

    public async Task<IEnumerable<CustomerListingDTO>> GetListingsAsync(CustomerListingFilterDTO filter, CancellationToken ct = default)
    {
        var listings = await _listingRepo.GetCustomerListingsAsync(
            filter.StoreId,
            filter.CategoryIds, 
            filter.MinPrice, 
            filter.MaxPrice, 
            filter.IsSurpriseBag, 
            filter.SortBy, 
            filter.SearchQuery,
            ct);

        var dtos = listings.Select(l => 
        {
            var dto = MapToDTO(l);
            if (filter.UserLat.HasValue && filter.UserLng.HasValue && l.Product.Store.Latitude.HasValue && l.Product.Store.Longitude.HasValue)
            {
                dto.Distance = Math.Round(CalculateHaversine(filter.UserLat.Value, filter.UserLng.Value, (double)l.Product.Store.Latitude.Value, (double)l.Product.Store.Longitude.Value), 1);
            }
            return dto;
        }).ToList();

        // User requirement: Do not hard filter by Radius, just prioritize items <= 5km.
        // If there's an explicit RadiusKm (e.g. from UI slider), we could filter, but user requested:
        // "Nếu có kết quả phù hợp nhất nhưng quá 5km thì vẫn phải xếp sau đơn hàng gần hơn"
        // So we will apply a multi-level sort to ALWAYS put <= 5km items first.

        if (filter.SortBy == "distance" && filter.UserLat.HasValue && filter.UserLng.HasValue)
        {
            dtos = dtos.OrderBy(d => d.Distance.HasValue && d.Distance <= 5 ? 0 : 1)
                       .ThenBy(d => d.Distance.HasValue ? 0 : 1)
                       .ThenBy(d => d.Distance)
                       .ThenByDescending(d => d.PriorityLevel).ToList();
        }
        else
        {
            // For any other sort (like price, priority, expiry), we STILL push > 5km to the bottom
            // Since we already got the data from DB (sorted by DB), we use OrderBy to stably sort the <=5km group vs >5km group
            // We must preserve the original order within the groups.
            var within5km = dtos.Where(d => !d.Distance.HasValue || d.Distance <= 5).ToList();
            var outside5km = dtos.Where(d => d.Distance.HasValue && d.Distance > 5).ToList();
            
            dtos = within5km.Concat(outside5km).ToList();
        }

        return dtos;
    }

    public async Task<IEnumerable<CustomerListingDTO>> GetRecommendationsAsync(Guid userId, double? userLat = null, double? userLng = null, CancellationToken ct = default)
    {
        // Lấy danh sách CategoryId từ lịch sử đơn hàng của User
        var favoriteCategoryIds = await _ctx.Orders
            .Where(o => o.UserId == userId)
            .SelectMany(o => o.OrderItems)
            .Select(oi => oi.Listing.Product.CategoryId)
            .Distinct()
            .ToListAsync(ct);

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
            .Where(l => (l.ListingFlags & 1) == 0 && l.Status == (byte)SaveFoodBackend.Models.Enums.ListingStatus.Published && l.ExpiryDate > DateTime.UtcNow && l.Product.Store.Status == (byte)SaveFoodBackend.Models.Enums.StoreStatus.Active) // Status 1 = Published
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

    private static CustomerListingDTO MapToDTO(SaveFoodBackend.Models.ClearanceListing l)
    {
        var activeSub = l.Product.Store.StoreSubscriptions?.FirstOrDefault();

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
            StoreStatus = l.Product.Store.Status
        };
    }
}
