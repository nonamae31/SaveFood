using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers
{
    [Route("api/stores")]
    [ApiController]
    public class StoresController : ApiControllerBase
    {
        private readonly IStoreService _storeService;

        public StoresController(IStoreService storeService)
        {
            _storeService = storeService;
        }

        // GET: api/stores
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetStores(System.Threading.CancellationToken ct)
        {
            var stores = await _storeService.GetCustomerStoresAsync(ct);
            return Ok(stores);
        }

        // POST: api/stores/register
        [HttpPost("register")]
        [Authorize]
        public async Task<IActionResult> RegisterStore([FromBody] RegisterStoreRequest request, System.Threading.CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var userId = GetRequiredUserId();
                var profile = await _storeService.RegisterStoreAsync(userId, request, ct);
                return Created("", profile);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi đăng ký cửa hàng.", details = ex.Message });
            }
        }

        // GET: api/stores/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStoreById(Guid id, System.Threading.CancellationToken ct)
        {
            var store = await _storeService.GetCustomerStoreByIdAsync(id, ct);
            if (store == null) return NotFound();
            return Ok(store);
        }

        // GET: api/stores/{id}/profile  (Dashboard — Staff only)
        [HttpGet("{id}/profile")]
        [Authorize]
        public async Task<IActionResult> GetStoreProfile(Guid id, System.Threading.CancellationToken ct)
        {
            try
            {
                var userId = GetRequiredUserId();
                var profile = await _storeService.GetStoreDashboardProfileAsync(id, userId, ct);
                return Ok(profile);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/stores/{id}/profile  (Dashboard — Staff only)
        [HttpPut("{id}/profile")]
        [Authorize]
        public async Task<IActionResult> UpdateStoreProfile(Guid id, [FromBody] UpdateStoreProfileRequest request, System.Threading.CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var userId = GetRequiredUserId();
                await _storeService.UpdateStoreProfileAsync(id, userId, request, ct);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/stores/{id}/images
        [HttpPut("{id}/images")]
        [Authorize] // Store Staff/Owner only
        public async Task<IActionResult> UpdateStoreImages(Guid id, [FromForm] UpdateStoreImagesRequest request)
        {
            try
            {
                var userId = GetRequiredUserId();
                await _storeService.UpdateStoreImagesAsync(id, userId, request);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while uploading images.", details = ex.Message });
            }
        }
        // GET: api/stores/{id}/analytics
        [HttpGet("{id}/analytics")]
        // [Authorize] // Temporarily disabled for testing if needed, or keep it
        public async Task<IActionResult> GetStoreAnalytics(Guid id)
        {
            try
            {
                var analytics = await _storeService.GetStoreAnalyticsAsync(id);
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching analytics.", details = ex.Message });
            }
        }
    }
}

