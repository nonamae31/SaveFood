using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Customer.Listings;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/customerlistings")]
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

    /// <summary>Gợi ý cá nhân hóa dựa trên lịch sử mua hàng.</summary>
    [HttpGet("recommendations")]
    [Authorize]
    public async Task<IActionResult> GetRecommendations(CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var listings = await _listingService.GetRecommendationsAsync(userId, ct);
        return Ok(listings);
    }
}

