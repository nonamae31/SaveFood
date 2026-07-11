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
[Authorize(Roles = "Store,StoreStaff")]
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

    /// <summary>Xóa Listing — tự động invalidate Redis cache.</summary>
    [HttpDelete("{listingId}")]
    public async Task<IActionResult> DeleteListing(Guid storeId, Guid listingId, CancellationToken ct)
    {
<<<<<<< HEAD
        await _sender.Send(new DeleteListingCommand(storeId, listingId), ct);
        return NoContent();
=======
        try
        {
            await _listingService.DeleteListingAsync(storeId, listingId, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex) when (ex.Message.StartsWith("ACTIVE_ORDERS_CONFLICT:"))
        {
            var orderCodesStr = ex.Message.Substring("ACTIVE_ORDERS_CONFLICT:".Length);
            var orderCodes = orderCodesStr.Split(',', StringSplitOptions.RemoveEmptyEntries);
            return StatusCode(409, new { 
                Message = "Không thể xóa sản phẩm do đang có đơn hàng xử lý.", 
                BlockingOrderCodes = orderCodes 
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
>>>>>>> origin/Develop_2
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
}
