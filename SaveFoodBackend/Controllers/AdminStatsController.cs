using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using System.Threading.Tasks;

namespace SaveFoodBackend.Controllers;

[Route("api/admin/stats")]
[ApiController]
[Authorize(Roles = "ADMIN,Admin")] // Uncomment when authentication is fully ready for admin
public class AdminStatsController : ControllerBase
{
    private readonly IAdminStatsService _adminStatsService;

    public AdminStatsController(IAdminStatsService adminStatsService)
    {
        _adminStatsService = adminStatsService;
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<AdminRevenueStatsResponse>> GetRevenueStats()
    {
        var result = await _adminStatsService.GetRevenueStatsAsync();
        return Ok(result);
    }

    [HttpGet("subscriptions")]
    public async Task<ActionResult<AdminSubscriptionStatsResponse>> GetSubscriptionStats()
    {
        var result = await _adminStatsService.GetSubscriptionStatsAsync();
        return Ok(result);
    }
}
