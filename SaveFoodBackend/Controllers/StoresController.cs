using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.DTOs.Customer.Stores;
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
        public async Task<IActionResult> GetStores([FromQuery] CustomerStoreFilterDTO filter, System.Threading.CancellationToken ct)
        {
            var stores = await _storeService.GetCustomerStoresAsync(filter, ct);
            return Ok(stores);
        }

        // POST: api/stores/register
        [HttpPost("register")]
        [Authorize]
        public async Task<IActionResult> RegisterStore([FromForm] RegisterStoreRequest request, System.Threading.CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var userId = GetRequiredUserId();
            try
            {
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

        // GET: api/stores/my-registrations
        [HttpGet("my-registrations")]
        [Authorize]
        public async Task<IActionResult> GetMyStoreRegistrations(System.Threading.CancellationToken ct)
        {
            var userId = GetRequiredUserId();
            var registrations = await _storeService.GetMyStoreRegistrationsAsync(userId, ct);
            return Ok(registrations);
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
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
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
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/stores/{id}/status
        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStoreStatus(Guid id, [FromBody] StoreStatusActionRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var userId = GetRequiredUserId();
            try
            {
                await _storeService.UpdateStoreStatusAsync(id, userId, request.Action);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/stores/{id}/images
        [HttpPut("{id}/images")]
        [Authorize] // Store Staff/Owner only
        public async Task<IActionResult> UpdateStoreImages(Guid id, [FromForm] UpdateStoreImagesRequest request)
        {
            var userId = GetRequiredUserId();
            try
            {
                await _storeService.UpdateStoreImagesAsync(id, userId, request);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
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
        [Authorize(Roles = "STORE,Store")]
        public async Task<IActionResult> GetStoreAnalytics(Guid id, [FromQuery] int days = 7)
        {
            try
            {
                var analytics = await _storeService.GetStoreAnalyticsAsync(id, days);
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching analytics.", details = ex.Message });
            }
        }
        // POST: api/stores/{id}/subscriptions/checkout
        [HttpPost("{id}/subscriptions/checkout")]
        [Authorize]
        public async Task<IActionResult> CreateSubscriptionCheckout(Guid id, [FromBody] SubscriptionCheckoutRequest request, System.Threading.CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var userId = GetRequiredUserId();
            try
            {
                var response = await _storeService.CreateSubscriptionCheckoutAsync(id, userId, request, ct);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống.", details = ex.Message });
            }
        }
        // POST: api/stores/extract-map-link
        [HttpPost("extract-map-link")]
        [AllowAnonymous]
        public async Task<IActionResult> ExtractMapLink([FromBody] ExtractMapLinkRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var url = request.Url;
                if (!url.Contains("google.com/maps") && !url.Contains("maps.app.goo.gl"))
                {
                    return BadRequest(new { message = "Không phải link Google Maps hợp lệ." });
                }

                string finalUrl = url;
                if (url.Contains("maps.app.goo.gl") || url.Contains("goo.gl/maps"))
                {
                    var handler = new System.Net.Http.HttpClientHandler { AllowAutoRedirect = false };
                    using var client = new System.Net.Http.HttpClient(handler);
                    var response = await client.GetAsync(url);
                    if (response.StatusCode == System.Net.HttpStatusCode.Found || response.StatusCode == System.Net.HttpStatusCode.MovedPermanently)
                    {
                        finalUrl = response.Headers.Location?.ToString() ?? url;
                    }
                }

                var result = new ExtractMapLinkResponse();

                var nameMatch = System.Text.RegularExpressions.Regex.Match(finalUrl, @"/place/([^/]+)/");
                if (nameMatch.Success)
                {
                    var rawName = nameMatch.Groups[1].Value;
                    result.Name = System.Net.WebUtility.UrlDecode(rawName).Replace("+", " ");
                }

                var exactCoordMatch = System.Text.RegularExpressions.Regex.Match(finalUrl, @"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)");
                if (exactCoordMatch.Success)
                {
                    if (decimal.TryParse(exactCoordMatch.Groups[1].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal lat) &&
                        decimal.TryParse(exactCoordMatch.Groups[2].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal lng))
                    {
                        result.Latitude = lat;
                        result.Longitude = lng;
                    }
                }
                else
                {
                    var centerMatch = System.Text.RegularExpressions.Regex.Match(finalUrl, @"@(-?\d+\.\d+),(-?\d+\.\d+)");
                    if (centerMatch.Success)
                    {
                        if (decimal.TryParse(centerMatch.Groups[1].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal lat) &&
                            decimal.TryParse(centerMatch.Groups[2].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal lng))
                        {
                            result.Latitude = lat;
                            result.Longitude = lng;
                        }
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi phân tích link.", details = ex.Message });
            }
        }
    }
}

