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

        // GET: api/stores/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStoreById(Guid id, System.Threading.CancellationToken ct)
        {
            var store = await _storeService.GetCustomerStoreByIdAsync(id, ct);
            if (store == null) return NotFound();
            return Ok(store);
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
    }
}
