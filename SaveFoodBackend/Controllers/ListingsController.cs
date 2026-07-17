using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Application.Features.Listings.Commands;
using SaveFoodBackend.Application.Features.Listings.Queries;
using SaveFoodBackend.DTOs.Store.Listings;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/stores/{storeId}/listings")]
[Authorize(Roles = "STORE,STORE_OWNER,Store,StoreStaff")]
public class ListingsController : ApiControllerBase
{
    private readonly ISender _sender;

    public ListingsController(ISender sender) => _sender = sender;

    /// <summary>Lấy tất cả Listings của Store.</summary>
    [HttpGet]
    public async Task<IActionResult> GetListings(Guid storeId, CancellationToken ct)
    {
        var result = await _sender.Send(new GetListingsByStoreQuery(storeId), ct);
        return Ok(result);
    }

    /// <summary>Lấy chi tiết Listing (bao gồm DiscountRules và Images).</summary>
    [HttpGet("{listingId}")]
    public async Task<IActionResult> GetListing(Guid storeId, Guid listingId, CancellationToken ct)
    {
        var result = await _sender.Send(new GetListingByIdQuery(storeId, listingId), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    /// <summary>Tạo Listing mới — tự động invalidate Redis cache.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateListing(Guid storeId, [FromBody] CreateListingDTO dto, CancellationToken ct)
    {
        var listing = await _sender.Send(new CreateListingCommand(storeId, dto), ct);
        return CreatedAtAction(nameof(GetListing), new { storeId, listingId = listing.Id }, listing);
    }

    /// <summary>Cập nhật Listing — tự động invalidate Redis cache.</summary>
    [HttpPut("{listingId}")]
    public async Task<IActionResult> UpdateListing(Guid storeId, Guid listingId, [FromBody] UpdateListingDTO dto, CancellationToken ct)
    {
        var result = await _sender.Send(new UpdateListingCommand(storeId, listingId, dto), ct);
        return Ok(result);
    }

    /// <summary>Xóa mềm Listing — tự động invalidate Redis cache.</summary>
    [HttpDelete("{listingId}")]
    public async Task<IActionResult> DeleteListing(Guid storeId, Guid listingId, CancellationToken ct)
    {
        await _sender.Send(new DeleteListingCommand(storeId, listingId), ct);
        return NoContent();
    }

    /// <summary>Upload ảnh cho Listing — tự động invalidate Redis cache.</summary>
    [HttpPost("{listingId}/images")]
    public async Task<IActionResult> UploadListingImages(Guid storeId, Guid listingId, [FromForm] List<IFormFile> images, CancellationToken ct)
    {
        var result = await _sender.Send(new UploadListingImagesCommand(storeId, listingId, images), ct);
        return Ok(result);
    }

    /// <summary>Xóa ảnh Listing — tự động invalidate Redis cache.</summary>
    [HttpDelete("{listingId}/images/{imageId}")]
    public async Task<IActionResult> DeleteListingImage(Guid storeId, Guid listingId, Guid imageId, CancellationToken ct)
    {
        var result = await _sender.Send(new DeleteListingImageCommand(storeId, listingId, imageId), ct);
        return Ok(result);
    }

    /// <summary>Bật/Tắt hiển thị Listing (toggle Published ↔ Draft).</summary>
    [HttpPatch("{listingId}/toggle-visibility")]
    public async Task<IActionResult> ToggleListingVisibility(Guid storeId, Guid listingId, CancellationToken ct)
    {
        var result = await _sender.Send(new ToggleListingVisibilityCommand(storeId, listingId), ct);
        return Ok(result);
    }

    /// <summary>Lấy danh sách Discount Rule Templates từ lịch sử Listings của Store.</summary>
    [HttpGet("rule-templates")]
    public async Task<IActionResult> GetRuleTemplates(Guid storeId, CancellationToken ct)
    {
        var result = await _sender.Send(new GetListingRuleTemplatesQuery(storeId), ct);
        return Ok(result);
    }
}
