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
    private readonly ICloudinaryService _cloudinaryService;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IStoreRepository _storeRepo;

    public ListingService(IListingRepository listingRepo, IProductRepository productRepo, ICloudinaryService cloudinaryService, ISubscriptionRepository subscriptionRepo, IStoreRepository storeRepo)
    {
        _listingRepo = listingRepo;
        _productRepo = productRepo;
        _cloudinaryService = cloudinaryService;
        _subscriptionRepo = subscriptionRepo;
        _storeRepo = storeRepo;
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
        var store = await _storeRepo.GetByIdAsync(storeId, ct);
        if (store == null || store.Status != (byte)StoreStatus.Active)
        {
            throw new Exception("Cửa hàng không hoạt động. Không thể tạo tin bán.");
        }

        var product = await _productRepo.GetByIdAsync(dto.ProductId, ct);
        if (product == null || product.StoreId != storeId)
        {
            throw new Exception("Product not found or access denied");
        }

        var activeSubscription = await _subscriptionRepo.GetActiveSubscriptionForStoreAsync(storeId, DateTime.UtcNow, ct);
        if (activeSubscription != null && activeSubscription.Plan.MaxActiveListings.HasValue)
        {
            var activeListingsCount = await _listingRepo.GetActiveListingsCountByStoreAsync(storeId, ct);
            if (activeListingsCount >= activeSubscription.Plan.MaxActiveListings.Value)
            {
                throw new Exception($"You have reached the maximum number of active listings ({activeSubscription.Plan.MaxActiveListings.Value}) for your current plan.");
            }
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
            CreatedAt = DateTime.UtcNow,
            Product = product // For mapping
        };

        // Tự động xác định trạng thái ngị dựa trên số lượng và ngày hết hạn
        if (listing.ExpiryDate <= DateTime.UtcNow)
            listing.Status = (byte)ListingStatus.Expired;
        else if (listing.QuantityAvailable <= 0)
            listing.Status = (byte)ListingStatus.SoldOut;

        // Tái sử dụng ảnh từ Product
        if (dto.ReusedProductImageIds != null && dto.ReusedProductImageIds.Any())
        {
            foreach (var imgId in dto.ReusedProductImageIds)
            {
                var productImg = product.ProductImages?.FirstOrDefault(i => i.Id == imgId);
                if (productImg != null)
                {
                    listing.ListingImages.Add(new ListingImage
                    {
                        ListingId = listing.Id,
                        ImageUrl = productImg.ImageUrl,
                        CloudinaryPublicId = null,
                        ImageFlags = 0
                    });
                }
            }
        }

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

        var wasPublished = listing.Status == (byte)ListingStatus.Published;

        // Tự động xác định trạng thái: Expired ưu tiên > SoldOut > giữ nguyên status do user chọn
        if (listing.ExpiryDate <= DateTime.UtcNow)
        {
            listing.Status = (byte)ListingStatus.Expired;
        }
        else if (listing.QuantityAvailable <= 0)
        {
            listing.Status = (byte)ListingStatus.SoldOut;
        }
        else
        {
            // Số lượng > 0 và chưa hết hạn: Không cho phép trạng thái SoldOut hoặc Expired
            listing.Status = dto.Status;
            if (listing.Status == (byte)ListingStatus.SoldOut || listing.Status == (byte)ListingStatus.Expired)
            {
                listing.Status = (byte)ListingStatus.Published;
            }
        }

        var newStatus = listing.Status;
        if (!wasPublished && newStatus == (byte)ListingStatus.Published)
        {
            var activeSubscription = await _subscriptionRepo.GetActiveSubscriptionForStoreAsync(storeId, DateTime.UtcNow, ct);
            if (activeSubscription != null && activeSubscription.Plan.MaxActiveListings.HasValue)
            {
                var activeListingsCount = await _listingRepo.GetActiveListingsCountByStoreAsync(storeId, ct);
                if (activeListingsCount >= activeSubscription.Plan.MaxActiveListings.Value)
                {
                    throw new Exception($"You have reached the maximum number of active listings ({activeSubscription.Plan.MaxActiveListings.Value}) for your current plan. Please upgrade to publish more.");
                }
            }
        }

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

        // Tái sử dụng ảnh từ Product khi Update
        if (dto.ReusedProductImageIds != null && dto.ReusedProductImageIds.Any())
        {
            var product = await _productRepo.GetByIdAsync(listing.ProductId, ct);
            if (product != null)
            {
                foreach (var imgId in dto.ReusedProductImageIds)
                {
                    var productImg = product.ProductImages?.FirstOrDefault(i => i.Id == imgId);
                    if (productImg != null)
                    {
                        listing.ListingImages.Add(new ListingImage
                        {
                            ListingId = listing.Id,
                            ImageUrl = productImg.ImageUrl,
                            CloudinaryPublicId = null,
                            ImageFlags = 0
                        });
                    }
                }
            }
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

    public async Task<ListingResponseDTO> UploadListingImagesAsync(Guid storeId, Guid listingId, IEnumerable<Microsoft.AspNetCore.Http.IFormFile> files, CancellationToken ct = default)
    {
        var listing = await _listingRepo.GetByIdWithRulesAsync(listingId, ct);
        if (listing == null || listing.Product?.StoreId != storeId)
        {
            throw new Exception("Listing not found or access denied");
        }

        if (files != null && files.Any())
        {
            var uploadResults = await _cloudinaryService.UploadImagesAsync(files);
            foreach (var result in uploadResults)
            {
                listing.ListingImages.Add(new ListingImage
                {
                    ListingId = listing.Id,
                    ImageUrl = result.SecureUrl,
                    CloudinaryPublicId = result.PublicId,
                    ImageFlags = 0
                });
            }

            try
            {
                await _listingRepo.SaveChangesAsync(ct);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException ex)
            {
                var entry = ex.Entries.FirstOrDefault();
                var entityName = entry?.Metadata.Name ?? "Unknown";
                throw new Exception($"DbUpdateConcurrencyException during UploadListingImagesAsync on entity {entityName}. State: {entry?.State}");
            }
        }

        return MapToDTO(listing);
    }

    public async Task<ListingResponseDTO> DeleteListingImageAsync(Guid storeId, Guid listingId, Guid imageId, CancellationToken ct = default)
    {
        var listing = await _listingRepo.GetByIdWithRulesAsync(listingId, ct);
        if (listing == null || listing.Product?.StoreId != storeId)
        {
            throw new Exception("Listing not found or access denied");
        }

        var image = listing.ListingImages.FirstOrDefault(i => i.Id == imageId);
        if (image == null)
        {
            throw new Exception("Image not found");
        }

        if (!string.IsNullOrEmpty(image.CloudinaryPublicId))
        {
            await _cloudinaryService.DeleteImageAsync(image.CloudinaryPublicId);
        }

        _listingRepo.RemoveImage(image);
        await _listingRepo.SaveChangesAsync(ct);

        return MapToDTO(listing);
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
                }).ToList(),
            Images = listing.ListingImages?.Select(img => new ListingImageResponseDTO
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl
            }).ToList() ?? new List<ListingImageResponseDTO>()
        };
    }
}
