using System.Threading;
using System.Threading.Tasks;
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
    public async Task<IActionResult> GetListings([FromQuery] CustomerListingFilterDTO filter, CancellationToken ct)
    {
        var listings = await _listingService.GetListingsAsync(filter, ct);
        return Ok(listings);
    }

    [HttpGet("recommendations")]
    public async Task<IActionResult> GetRecommendations(CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        
        var listings = await _listingService.GetRecommendationsAsync(userId, ct);
        return Ok(listings);
    }
}
