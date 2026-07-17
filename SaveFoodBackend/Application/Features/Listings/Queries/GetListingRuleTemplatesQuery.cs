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

// ─── Query: Get Discount Rule Templates for a Store ───────────────────────────
// Trả về tập DiscountRule[] từ tất cả Listing lịch sử (kể cả đã IsDeleted)
// để cửa hàng có thể load nhanh khi tạo Listing mới.

public record GetListingRuleTemplatesQuery(Guid StoreId) : IRequest<IEnumerable<RuleTemplateDTO>>;

public class GetListingRuleTemplatesQueryHandler : IRequestHandler<GetListingRuleTemplatesQuery, IEnumerable<RuleTemplateDTO>>
{
    private readonly IListingRepository _repo;

    public GetListingRuleTemplatesQueryHandler(IListingRepository repo) => _repo = repo;

    public async Task<IEnumerable<RuleTemplateDTO>> Handle(GetListingRuleTemplatesQuery request, CancellationToken ct)
    {
        // Lấy TẤT CẢ listing của store — kể cả đã xóa mềm — để làm template
        var listings = await _repo.GetAllByStoreIdAsync(request.StoreId, ct);

        return listings
            .Where(l => l.ListingDiscountRules != null && l.ListingDiscountRules.Any(r => !r.IsDeleted))
            .Select(l => new RuleTemplateDTO
            {
                ListingId = l.Id,
                ListingTitle = l.Title,
                ProductName = l.Product?.Name ?? string.Empty,
                Rules = l.ListingDiscountRules
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
            })
            .ToList();
    }
}
