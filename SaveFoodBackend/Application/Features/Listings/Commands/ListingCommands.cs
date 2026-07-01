using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Http;
using SaveFoodBackend.Application.Features.Listings.Queries;
using SaveFoodBackend.DTOs.Store.Listings;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Features.Listings.Commands;

// ─── Create Listing ────────────────────────────────────────────────────────────

public record CreateListingCommand(Guid StoreId, CreateListingDTO Dto) : IRequest<ListingResponseDTO>;

public class CreateListingCommandHandler : IRequestHandler<CreateListingCommand, ListingResponseDTO>
{
    private readonly IListingRepository _listingRepo;
    private readonly IProductRepository _productRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IStoreRepository _storeRepo;
    private readonly IRedisService _redis;

    public CreateListingCommandHandler(
        IListingRepository listingRepo, IProductRepository productRepo,
        ISubscriptionRepository subscriptionRepo, IStoreRepository storeRepo,
        IRedisService redis)
    {
        _listingRepo = listingRepo;
        _productRepo = productRepo;
        _subscriptionRepo = subscriptionRepo;
        _storeRepo = storeRepo;
        _redis = redis;
    }

    public async Task<ListingResponseDTO> Handle(CreateListingCommand request, CancellationToken ct)
    {
        var store = await _storeRepo.GetByIdAsync(request.StoreId, ct);
        if (store == null || store.Status != (byte)StoreStatus.Active)
            throw new InvalidOperationException("Cửa hàng không hoạt động. Không thể tạo tin bán.");

        var product = await _productRepo.GetByIdAsync(request.Dto.ProductId, ct);
        if (product == null || product.StoreId != request.StoreId)
            throw new InvalidOperationException("Product not found or access denied.");

        var activeSub = await _subscriptionRepo.GetActiveSubscriptionForStoreAsync(request.StoreId, DateTime.UtcNow, ct);
        if (activeSub?.Plan.MaxActiveListings.HasValue == true)
        {
            var count = await _listingRepo.GetActiveListingsCountByStoreAsync(request.StoreId, ct);
            if (count >= activeSub.Plan.MaxActiveListings.Value)
                throw new InvalidOperationException($"Bạn đã đạt giới hạn {activeSub.Plan.MaxActiveListings.Value} tin đang bán của gói hiện tại.");
        }

        var listing = new ClearanceListing
        {
            Id = Guid.NewGuid(),
            ProductId = request.Dto.ProductId,
            Title = request.Dto.Title,
            SalePrice = request.Dto.SalePrice,
            QuantityAvailable = request.Dto.QuantityAvailable,
            ExpiryDate = request.Dto.ExpiryDate.ToUniversalTime(),
            Status = (byte)ListingStatus.Published,
            CreatedAt = DateTime.UtcNow,
            Product = product
        };

        if (listing.ExpiryDate <= DateTime.UtcNow)
            listing.Status = (byte)ListingStatus.Expired;
        else if (listing.QuantityAvailable <= 0)
            listing.Status = (byte)ListingStatus.SoldOut;

        // Reuse product images
        if (request.Dto.ReusedProductImageIds?.Any() == true)
        {
            foreach (var imgId in request.Dto.ReusedProductImageIds)
            {
                var productImg = product.ProductImages?.FirstOrDefault(i => i.Id == imgId);
                if (productImg != null)
                    listing.ListingImages.Add(new ListingImage
                    {
                        ListingId = listing.Id,
                        ImageUrl = productImg.ImageUrl,
                        CloudinaryPublicId = null,
                        ImageFlags = 0
                    });
            }
        }

        // Discount rules
        foreach (var ruleDto in request.Dto.DiscountRules)
        {
            listing.ListingDiscountRules.Add(new ListingDiscountRule
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
            });
        }

        await _listingRepo.AddAsync(listing, ct);
        await _listingRepo.SaveChangesAsync(ct);

        // ✅ Invalidate all listings cache
        await _redis.DeleteByPatternAsync("listings:*");

        return GetListingsByStoreQueryHandler.MapToDTO(listing);
    }
}

// ─── Update Listing ────────────────────────────────────────────────────────────

public record UpdateListingCommand(Guid StoreId, Guid ListingId, UpdateListingDTO Dto) : IRequest<ListingResponseDTO>;

public class UpdateListingCommandHandler : IRequestHandler<UpdateListingCommand, ListingResponseDTO>
{
    private readonly IListingRepository _listingRepo;
    private readonly IProductRepository _productRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IRedisService _redis;

    public UpdateListingCommandHandler(
        IListingRepository listingRepo, IProductRepository productRepo,
        ISubscriptionRepository subscriptionRepo, IRedisService redis)
    {
        _listingRepo = listingRepo;
        _productRepo = productRepo;
        _subscriptionRepo = subscriptionRepo;
        _redis = redis;
    }

    public async Task<ListingResponseDTO> Handle(UpdateListingCommand request, CancellationToken ct)
    {
        var listing = await _listingRepo.GetByIdWithRulesAsync(request.ListingId, ct);
        if (listing == null || listing.Product?.StoreId != request.StoreId)
            throw new InvalidOperationException("Listing not found or access denied.");

        listing.Title = request.Dto.Title;
        listing.SalePrice = request.Dto.SalePrice;
        listing.QuantityAvailable = request.Dto.QuantityAvailable;
        listing.ExpiryDate = request.Dto.ExpiryDate.ToUniversalTime();

        var wasPublished = listing.Status == (byte)ListingStatus.Published;

        if (listing.ExpiryDate <= DateTime.UtcNow)
            listing.Status = (byte)ListingStatus.Expired;
        else if (listing.QuantityAvailable <= 0)
            listing.Status = (byte)ListingStatus.SoldOut;
        else
        {
            listing.Status = request.Dto.Status;
            if (listing.Status == (byte)ListingStatus.SoldOut || listing.Status == (byte)ListingStatus.Expired)
                listing.Status = (byte)ListingStatus.Published;
        }

        if (!wasPublished && listing.Status == (byte)ListingStatus.Published)
        {
            var activeSub = await _subscriptionRepo.GetActiveSubscriptionForStoreAsync(request.StoreId, DateTime.UtcNow, ct);
            if (activeSub?.Plan.MaxActiveListings.HasValue == true)
            {
                var count = await _listingRepo.GetActiveListingsCountByStoreAsync(request.StoreId, ct);
                if (count >= activeSub.Plan.MaxActiveListings.Value)
                    throw new InvalidOperationException($"Đã đạt giới hạn {activeSub.Plan.MaxActiveListings.Value} tin của gói hiện tại.");
            }
        }

        // Replace discount rules
        foreach (var oldRule in listing.ListingDiscountRules)
            oldRule.IsDeleted = true;

        foreach (var ruleDto in request.Dto.DiscountRules)
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

        // Reuse product images
        if (request.Dto.ReusedProductImageIds?.Any() == true)
        {
            var product = await _productRepo.GetByIdAsync(listing.ProductId, ct);
            if (product != null)
            {
                foreach (var imgId in request.Dto.ReusedProductImageIds)
                {
                    var productImg = product.ProductImages?.FirstOrDefault(i => i.Id == imgId);
                    if (productImg != null)
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

        await _listingRepo.SaveChangesAsync(ct);

        // ✅ Invalidate all listings cache
        await _redis.DeleteByPatternAsync("listings:*");

        var updated = await _listingRepo.GetByIdWithRulesAsync(request.ListingId, ct);
        return GetListingsByStoreQueryHandler.MapToDTO(updated!);
    }
}

// ─── Delete Listing ────────────────────────────────────────────────────────────

public record DeleteListingCommand(Guid StoreId, Guid ListingId) : IRequest;

public class DeleteListingCommandHandler : IRequestHandler<DeleteListingCommand>
{
    private readonly IListingRepository _repo;
    private readonly IRedisService _redis;

    public DeleteListingCommandHandler(IListingRepository repo, IRedisService redis)
    {
        _repo = repo;
        _redis = redis;
    }

    public async Task Handle(DeleteListingCommand request, CancellationToken ct)
    {
        var listing = await _repo.GetByIdWithRulesAsync(request.ListingId, ct);
        if (listing == null || listing.Product?.StoreId != request.StoreId)
            throw new InvalidOperationException("Listing not found or access denied.");

        _repo.Delete(listing);
        await _repo.SaveChangesAsync(ct);

        // ✅ Invalidate all listings cache
        await _redis.DeleteByPatternAsync("listings:*");
    }
}

// ─── Upload Listing Images ─────────────────────────────────────────────────────

public record UploadListingImagesCommand(Guid StoreId, Guid ListingId, IEnumerable<IFormFile> Files) : IRequest<ListingResponseDTO>;

public class UploadListingImagesCommandHandler : IRequestHandler<UploadListingImagesCommand, ListingResponseDTO>
{
    private readonly IListingRepository _repo;
    private readonly ICloudinaryService _cloudinary;
    private readonly IRedisService _redis;

    public UploadListingImagesCommandHandler(IListingRepository repo, ICloudinaryService cloudinary, IRedisService redis)
    {
        _repo = repo;
        _cloudinary = cloudinary;
        _redis = redis;
    }

    public async Task<ListingResponseDTO> Handle(UploadListingImagesCommand request, CancellationToken ct)
    {
        var listing = await _repo.GetByIdWithRulesAsync(request.ListingId, ct);
        if (listing == null || listing.Product?.StoreId != request.StoreId)
            throw new InvalidOperationException("Listing not found or access denied.");

        if (request.Files?.Any() == true)
        {
            var uploadResults = await _cloudinary.UploadImagesAsync(request.Files);
            foreach (var result in uploadResults)
                listing.ListingImages.Add(new ListingImage
                {
                    ListingId = listing.Id,
                    ImageUrl = result.SecureUrl,
                    CloudinaryPublicId = result.PublicId,
                    ImageFlags = 0
                });

            await _repo.SaveChangesAsync(ct);
            await _redis.DeleteByPatternAsync("listings:*");
        }

        return GetListingsByStoreQueryHandler.MapToDTO(listing);
    }
}

// ─── Delete Listing Image ──────────────────────────────────────────────────────

public record DeleteListingImageCommand(Guid StoreId, Guid ListingId, Guid ImageId) : IRequest<ListingResponseDTO>;

public class DeleteListingImageCommandHandler : IRequestHandler<DeleteListingImageCommand, ListingResponseDTO>
{
    private readonly IListingRepository _repo;
    private readonly ICloudinaryService _cloudinary;
    private readonly IRedisService _redis;

    public DeleteListingImageCommandHandler(IListingRepository repo, ICloudinaryService cloudinary, IRedisService redis)
    {
        _repo = repo;
        _cloudinary = cloudinary;
        _redis = redis;
    }

    public async Task<ListingResponseDTO> Handle(DeleteListingImageCommand request, CancellationToken ct)
    {
        var listing = await _repo.GetByIdWithRulesAsync(request.ListingId, ct);
        if (listing == null || listing.Product?.StoreId != request.StoreId)
            throw new InvalidOperationException("Listing not found or access denied.");

        var image = listing.ListingImages.FirstOrDefault(i => i.Id == request.ImageId)
            ?? throw new InvalidOperationException("Image not found.");

        if (!string.IsNullOrEmpty(image.CloudinaryPublicId))
            await _cloudinary.DeleteImageAsync(image.CloudinaryPublicId);

        _repo.RemoveImage(image);
        await _repo.SaveChangesAsync(ct);
        await _redis.DeleteByPatternAsync("listings:*");

        return GetListingsByStoreQueryHandler.MapToDTO(listing);
    }
}
