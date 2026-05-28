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

    public async Task<IEnumerable<CustomerListingDTO>> GetListingsAsync(CustomerListingFilterDTO filter, CancellationToken ct = default)
    {
        var listings = await _listingRepo.GetCustomerListingsAsync(
            filter.CategoryId, 
            filter.MinPrice, 
            filter.MaxPrice, 
            filter.IsSurpriseBag, 
            filter.SortBy, 
            ct);

        return listings.Select(MapToDTO);
    }

    public async Task<IEnumerable<CustomerListingDTO>> GetRecommendationsAsync(Guid userId, CancellationToken ct = default)
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
            // Nếu người dùng chưa từng mua gì, trả về các tin đăng mới nhất (fallback)
            var recentListings = await _listingRepo.GetCustomerListingsAsync(null, null, null, null, "expiry_asc", ct);
            return recentListings.Take(10).Select(MapToDTO);
        }

        // Lấy các tin đăng thuộc danh mục yêu thích
        var recommendedListings = await _ctx.ClearanceListings
            .Include(l => l.Product)
                .ThenInclude(p => p.Store)
            .Include(l => l.Product)
                .ThenInclude(p => p.ProductImages)
            .Include(l => l.ListingImages)
            .Where(l => (l.ListingFlags & 1) == 0 && l.Status == (byte)SaveFoodBackend.Models.Enums.ListingStatus.Published && l.ExpiryDate > DateTime.UtcNow) // Status 1 = Published
            .Where(l => favoriteCategoryIds.Contains(l.Product.CategoryId))
            .OrderBy(l => l.ExpiryDate)
            .Take(10)
            .AsNoTracking()
            .ToListAsync(ct);

        return recommendedListings.Select(MapToDTO);
    }

    private static CustomerListingDTO MapToDTO(SaveFoodBackend.Models.ClearanceListing l)
    {
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
                     : l.Product.ProductImages?.Select(i => i.ImageUrl).ToList() ?? new List<string>()
        };
    }
}
