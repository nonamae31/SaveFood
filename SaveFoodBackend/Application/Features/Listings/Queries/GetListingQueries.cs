using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.DTOs.Store.Listings;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Features.Listings.Queries;

// ─── Query: Get all listings by store ─────────────────────────────────────────

public record GetListingsByStoreQuery(Guid StoreId) : IRequest<IEnumerable<ListingResponseDTO>>;

public class GetListingsByStoreQueryHandler : IRequestHandler<GetListingsByStoreQuery, IEnumerable<ListingResponseDTO>>
{
    private readonly IListingRepository _repo;

    public GetListingsByStoreQueryHandler(IListingRepository repo) => _repo = repo;

    public async Task<IEnumerable<ListingResponseDTO>> Handle(GetListingsByStoreQuery request, CancellationToken ct)
    {
        var listings = await _repo.GetByStoreIdAsync(request.StoreId, ct);
        return listings.Select(MapToDTO);
    }

    internal static ListingResponseDTO MapToDTO(SaveFoodBackend.Models.ClearanceListing listing) => new()
    {
        Id = listing.Id,
        ProductId = listing.ProductId,
        Title = listing.Title,
        SalePrice = listing.SalePrice,
        QuantityAvailable = listing.QuantityAvailable,
        ExpiryDate = listing.ExpiryDate,
        Status = listing.Status,
        CreatedAt = listing.CreatedAt,
        DiscountRules = listing.ListingDiscountRules?
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
            }).ToList() ?? new(),
        Images = listing.ListingImages?.Select(img => new ListingImageResponseDTO
        {
            Id = img.Id,
            ImageUrl = img.ImageUrl
        }).ToList() ?? new()
    };
}

// ─── Query: Get listing by id ─────────────────────────────────────────────────

public record GetListingByIdQuery(Guid StoreId, Guid ListingId) : IRequest<ListingResponseDTO?>;

public class GetListingByIdQueryHandler : IRequestHandler<GetListingByIdQuery, ListingResponseDTO?>
{
    private readonly IListingRepository _repo;

    public GetListingByIdQueryHandler(IListingRepository repo) => _repo = repo;

    public async Task<ListingResponseDTO?> Handle(GetListingByIdQuery request, CancellationToken ct)
    {
        var listing = await _repo.GetByIdWithRulesAsync(request.ListingId, ct);
        if (listing == null || listing.Product?.StoreId != request.StoreId)
            return null;

        return GetListingsByStoreQueryHandler.MapToDTO(listing);
    }
}
