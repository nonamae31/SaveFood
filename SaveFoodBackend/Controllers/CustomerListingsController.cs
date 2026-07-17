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

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetListings([FromQuery] CustomerListingFilterDTO filter, CancellationToken ct)
    {
        var listings = await _listingService.GetListingsAsync(filter, ct);
        return Ok(listings);
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

    [HttpGet("recommendations")]
    [Authorize]
    public async Task<IActionResult> GetRecommendations([FromQuery] double? userLat, [FromQuery] double? userLng, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        
        var listings = await _listingService.GetRecommendationsAsync(userId, userLat, userLng, ct);
        return Ok(listings);
    }
}
