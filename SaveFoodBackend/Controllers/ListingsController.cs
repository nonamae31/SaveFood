using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Store.Listings;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/stores/{storeId}/listings")]
[Microsoft.AspNetCore.Authorization.Authorize(Roles = "STORE")]
public class ListingsController : ControllerBase
{
    private readonly IListingService _listingService;

    public ListingsController(IListingService listingService)
    {
        _listingService = listingService;
    }
    
    [HttpGet]
    public async Task<IActionResult> GetListings(Guid storeId, CancellationToken ct)
    {
        var listings = await _listingService.GetListingsByStoreAsync(storeId, ct);
        return Ok(listings);
    }

    [HttpGet("{listingId}")]
    public async Task<IActionResult> GetListing(Guid storeId, Guid listingId, CancellationToken ct)
    {
        var listing = await _listingService.GetListingByIdAsync(storeId, listingId, ct);
        if (listing == null)
            return NotFound();
            
        return Ok(listing);
    }

    [HttpPost]
    public async Task<IActionResult> CreateListing(Guid storeId, [FromBody] CreateListingDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var listing = await _listingService.CreateListingAsync(storeId, dto, ct);
            return CreatedAtAction(nameof(GetListing), new { storeId, listingId = listing.Id }, listing);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("{listingId}")]
    public async Task<IActionResult> UpdateListing(Guid storeId, Guid listingId, [FromBody] UpdateListingDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var listing = await _listingService.UpdateListingAsync(storeId, listingId, dto, ct);
            return Ok(listing);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpDelete("{listingId}")]
    public async Task<IActionResult> DeleteListing(Guid storeId, Guid listingId, CancellationToken ct)
    {
        try
        {
            await _listingService.DeleteListingAsync(storeId, listingId, ct);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("{listingId}/images")]
    public async Task<IActionResult> UploadListingImages(Guid storeId, Guid listingId, [FromForm] System.Collections.Generic.List<Microsoft.AspNetCore.Http.IFormFile> images, CancellationToken ct)
    {
        try
        {
            var result = await _listingService.UploadListingImagesAsync(storeId, listingId, images, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpDelete("{listingId}/images/{imageId}")]
    public async Task<IActionResult> DeleteListingImage(Guid storeId, Guid listingId, Guid imageId, CancellationToken ct)
    {
        try
        {
            var result = await _listingService.DeleteListingImageAsync(storeId, listingId, imageId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
