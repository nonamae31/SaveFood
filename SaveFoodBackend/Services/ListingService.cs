using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store.Listings;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services;

public class ListingService : IListingService
{
    private readonly IListingRepository _listingRepo;
    private readonly IProductRepository _productRepo;

    public ListingService(IListingRepository listingRepo, IProductRepository productRepo)
    {
        _listingRepo = listingRepo;
        _productRepo = productRepo;
    }

    public async Task<IEnumerable<ListingResponseDTO>> GetListingsByStoreAsync(Guid storeId, CancellationToken ct = default)
    {
        var listings = await _listingRepo.GetByStoreIdAsync(storeId, ct);
        return listings.Select(MapToDTO);
    }

    public async Task<ListingResponseDTO?> GetListingByIdAsync(Guid storeId, Guid listingId, CancellationToken ct = default)
    {
        var listing = await _listingRepo.GetByIdWithRulesAsync(listingId, ct);
        if (listing == null || listing.Product?.StoreId != storeId)
        {
            return null;
        }

        return MapToDTO(listing);
    }

    public async Task<ListingResponseDTO> CreateListingAsync(Guid storeId, CreateListingDTO dto, CancellationToken ct = default)
    {
        var product = await _productRepo.GetByIdAsync(dto.ProductId, ct);
        if (product == null || product.StoreId != storeId)
        {
            throw new Exception("Product not found or access denied");
        }

        var listing = new ClearanceListing
        {
            Id = Guid.NewGuid(),
            ProductId = dto.ProductId,
            Title = dto.Title,
            SalePrice = dto.SalePrice,
            QuantityAvailable = dto.QuantityAvailable,
            ExpiryDate = dto.ExpiryDate.ToUniversalTime(),
            Status = (byte)ListingStatus.Published,
            IsAutoRenew = dto.IsAutoRenew,
            CreatedAt = DateTime.UtcNow,
            Product = product // For mapping
        };

        foreach (var ruleDto in dto.DiscountRules)
        {
            var rule = new ListingDiscountRule
            {
                Id = Guid.NewGuid(),
                ListingId = listing.Id,
                RuleOrder = ruleDto.RuleOrder,
                DiscountPercent = ruleDto.DiscountPercent,
                TargetPrice = ruleDto.TargetPrice,
                TriggerValue = ruleDto.TriggerValue,
                TriggerType = ruleDto.TriggerType,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            listing.ListingDiscountRules.Add(rule);
        }

        await _listingRepo.AddAsync(listing, ct);
        await _listingRepo.SaveChangesAsync(ct);

        return MapToDTO(listing);
    }

    public async Task<ListingResponseDTO> UpdateListingAsync(Guid storeId, Guid listingId, UpdateListingDTO dto, CancellationToken ct = default)
    {
        var listing = await _listingRepo.GetByIdWithRulesAsync(listingId, ct);
        if (listing == null || listing.Product?.StoreId != storeId)
        {
            throw new Exception("Listing not found or access denied");
        }

        listing.Title = dto.Title;
        listing.SalePrice = dto.SalePrice;
        listing.QuantityAvailable = dto.QuantityAvailable;
        listing.ExpiryDate = dto.ExpiryDate.ToUniversalTime();
        listing.Status = dto.Status;
        listing.IsAutoRenew = dto.IsAutoRenew;

        // Xóa rules cũ (đánh dấu IsDeleted = 2)
        foreach (var oldRule in listing.ListingDiscountRules)
        {
            oldRule.IsDeleted = true;
        }

        // Thêm rules mới
        foreach (var ruleDto in dto.DiscountRules)
        {
            listing.ListingDiscountRules.Add(new ListingDiscountRule
            {
                ListingId = listing.Id,
                RuleOrder = ruleDto.RuleOrder,
                DiscountPercent = ruleDto.DiscountPercent,
                TargetPrice = ruleDto.TargetPrice,
                TriggerValue = ruleDto.TriggerValue,
                TriggerType = ruleDto.TriggerType,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _listingRepo.SaveChangesAsync(ct);

        // Fetch again to get updated rules correctly mapped
        var updatedListing = await _listingRepo.GetByIdWithRulesAsync(listingId, ct);
        return MapToDTO(updatedListing!);
    }

    public async Task DeleteListingAsync(Guid storeId, Guid listingId, CancellationToken ct = default)
    {
        var listing = await _listingRepo.GetByIdWithRulesAsync(listingId, ct);
        if (listing == null || listing.Product?.StoreId != storeId)
        {
            throw new Exception("Listing not found or access denied");
        }

        _listingRepo.Delete(listing);
        await _listingRepo.SaveChangesAsync(ct);
    }

    private static ListingResponseDTO MapToDTO(ClearanceListing listing)
    {
        return new ListingResponseDTO
        {
            Id = listing.Id,
            ProductId = listing.ProductId,
            Title = listing.Title,
            SalePrice = listing.SalePrice,
            QuantityAvailable = listing.QuantityAvailable,
            ExpiryDate = listing.ExpiryDate,
            Status = listing.Status,
            IsAutoRenew = listing.IsAutoRenew,
            CreatedAt = listing.CreatedAt,
            DiscountRules = listing.ListingDiscountRules
                .Where(r => !r.IsDeleted)
                .Select(r => new DiscountRuleResponseDTO
                {
                    Id = r.Id,
                    RuleOrder = r.RuleOrder,
                    DiscountPercent = r.DiscountPercent,
                    TargetPrice = r.TargetPrice,
                    TriggerValue = r.TriggerValue,
                    TriggerType = r.TriggerType,
                    IsActive = r.IsActive
                }).ToList()
        };
    }
}
