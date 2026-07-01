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
    [Authorize(Roles = "ADMIN,Admin")] // Uncomment when auth is re-enabled globally
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly MediatR.IMediator _mediator;

        public AdminController(IAdminService adminService, MediatR.IMediator mediator)
        {
            _adminService = adminService;
            _mediator = mediator;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<ActionResult<PaginatedList<AdminUserListDTO>>> GetUsers([FromQuery] GetUsersRequestDTO request)
        {
            var users = await _adminService.GetUsersAsync(request);
            return Ok(users);
        }

        // POST: api/admin/users
        [HttpPost("users")]
        public async Task<IActionResult> AddUser([FromBody] AddUserRequestDTO request)
        {
            try
            {
                await _adminService.AddUserAsync(request);
                return Ok(new { message = "User created successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
            var adminIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(adminIdClaim) || !Guid.TryParse(adminIdClaim, out Guid adminId))
            {
                // Fallback for development if needed
                adminId = Guid.Empty;
            }

            var command = new SaveFoodBackend.Application.Features.Stores.Commands.ApproveStoreCommand
            {
                StoreId = id,
                AdminId = adminId
            };

            await _mediator.Send(command);
            return Ok(new { message = "Store approved successfully" });
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
        // GET: api/admin/stores
        [HttpGet("stores")]
        public async Task<ActionResult<PaginatedList<AdminStoreListDTO>>> GetStores([FromQuery] string? search, [FromQuery] byte? status, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var stores = await _adminService.GetStoresAsync(search, status, pageNumber, pageSize);
            return Ok(stores);
        }

        // GET: api/admin/stores/{id}
        [HttpGet("stores/{id}")]
        public async Task<ActionResult<AdminStoreDetailsDTO>> GetStoreDetails(Guid id)
        {
            try
            {
                var storeDetails = await _adminService.GetStoreDetailsAsync(id);
                return Ok(storeDetails);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/admin/stores/{id}/status
        [HttpPut("stores/{id}/status")]
        public async Task<IActionResult> UpdateStoreStatus(Guid id, [FromBody] UpdateStoreStatusRequest request)
        {
            try
            {
                await _adminService.UpdateStoreStatusAsync(id, request.NewStatus);
                return Ok(new { message = "Store status updated successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
