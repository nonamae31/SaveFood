using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Common;

namespace SaveFoodBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles = "ADMIN")] // Uncomment when auth is re-enabled globally
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<ActionResult<PaginatedList<AdminUserListDTO>>> GetUsers([FromQuery] GetUsersRequestDTO request)
        {
            var users = await _adminService.GetUsersAsync(request);
            return Ok(users);
        }

        // GET: api/admin/users/{id}
        [HttpGet("users/{id}")]
        public async Task<ActionResult<AdminUserDetailsDTO>> GetUserDetails(Guid id)
        {
            try
            {
                var userDetails = await _adminService.GetUserDetailsAsync(id);
                return Ok(userDetails);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/admin/users/{id}/status
        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
        {
            try
            {
                await _adminService.UpdateUserStatusAsync(id, request.NewStatus);
                return Ok(new { message = "User status updated successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // GET: api/admin/stores/pending
        [HttpGet("stores/pending")]
        public async Task<ActionResult<IEnumerable<AdminStoreApprovalDTO>>> GetPendingStores()
        {
            var stores = await _adminService.GetPendingStoresAsync();
            return Ok(stores);
        }

        // PUT: api/admin/stores/{id}/approve
        [HttpPut("stores/{id}/approve")]
        public async Task<IActionResult> ApproveStore(Guid id)
        {
            try
            {
                await _adminService.ApproveStoreAsync(id);
                return Ok(new { message = "Store approved successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/admin/stores/{id}/reject
        [HttpPut("stores/{id}/reject")]
        public async Task<IActionResult> RejectStore(Guid id, [FromBody] RejectStoreRequest request)
        {
            try
            {
                await _adminService.RejectStoreAsync(id, request);
                return Ok(new { message = "Store rejected successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
