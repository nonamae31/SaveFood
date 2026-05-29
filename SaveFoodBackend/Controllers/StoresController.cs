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

        // PUT: api/stores/{id}/images
        [HttpPut("{id}/images")]
        [Authorize] // Store Staff/Owner only
        public async Task<IActionResult> UpdateStoreImages(Guid id, [FromForm] UpdateStoreImagesRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
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
