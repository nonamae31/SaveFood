using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Customer.Listings;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/listings")]
public class CustomerListingsController : ApiControllerBase
{
    private readonly ICustomerListingService _listingService;

    public CustomerListingsController(ICustomerListingService listingService)
    {
        _listingService = listingService;
    }

    /// <summary>Lấy danh sách Clearance Listings có filter + phân trang (dùng cho Infinite Scroll).</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetListings([FromQuery] CustomerListingFilterDTO filter, CancellationToken ct)
    {
        var result = await _listingService.GetListingsAsync(filter, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetListing(Guid id, [FromQuery] double? userLat, [FromQuery] double? userLng, CancellationToken ct)
    {
        var listing = await _listingService.GetListingByIdAsync(id, userLat, userLng, ct);
        if (listing == null)
            return NotFound();
        return Ok(listing);
    }

    /// <summary>Gợi ý cá nhân hóa dựa trên lịch sử mua hàng.</summary>
    [HttpGet("recommendations")]
    [Authorize]
    public async Task<IActionResult> GetRecommendations([FromQuery] double? userLat, [FromQuery] double? userLng, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        
        var listings = await _listingService.GetRecommendationsAsync(userId, userLat, userLng, ct);
        return Ok(listings);
    }
}

