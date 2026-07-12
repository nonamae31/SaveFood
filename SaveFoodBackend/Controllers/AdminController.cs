using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Common;
using Microsoft.EntityFrameworkCore;

namespace SaveFoodBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "ADMIN,Admin")] // Uncomment when auth is re-enabled globally
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly MediatR.IMediator _mediator;
        private readonly SaveFoodBackend.Data.SaveFoodDbContext _ctx;

        public AdminController(IAdminService adminService, MediatR.IMediator mediator, SaveFoodBackend.Data.SaveFoodDbContext ctx)
        {
            _adminService = adminService;
            _mediator = mediator;
            _ctx = ctx;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        [Authorize(Roles = "ADMIN,Admin")]
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

        // GET: api/admin/search
        [HttpGet("search")]
        public async Task<ActionResult<GlobalSearchResponseDTO>> GlobalSearch([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return BadRequest(new { message = "Keyword is required" });
            }

            var result = await _adminService.GlobalSearchAsync(keyword);
            return Ok(result);
        }

        // GET: api/admin/search/locate
        [HttpGet("search/locate")]
        public async Task<IActionResult> SearchLocate([FromQuery] string type, [FromQuery] string id, [FromQuery] int pageSize = 10, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] string? statusFilter = null)
        {
            if (string.IsNullOrEmpty(type) || string.IsNullOrEmpty(id)) return BadRequest();

            if (type == "user" || type == "store")
            {
                if (!Guid.TryParse(id, out var guidId)) return BadRequest();
                var index = -1;
                if (type == "user")
                {
                    var allIds = await _ctx.Users.OrderByDescending(u => u.CreatedAt).ThenBy(u => u.Id).Select(u => u.Id).ToListAsync();
                    index = allIds.FindIndex(i => i == guidId);
                }
                else
                {
                    var allIds = await _ctx.Stores.OrderByDescending(s => s.CreatedAt).ThenByDescending(s => s.Id).Select(s => s.Id).ToListAsync();
                    index = allIds.FindIndex(i => i == guidId);
                }

                if (index == -1) return NotFound();
                return Ok(new { found = true, pageNumber = (index / pageSize) + 1, highlightId = id });
            }
            
            if (type == "order")
            {
                if (!long.TryParse(id, out var orderCode)) return BadRequest();
                var order = await _ctx.Orders.FirstOrDefaultAsync(o => o.OrderCode == orderCode);
                var payment = order != null ? await _ctx.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id && p.Status == 1) : null;
                var sub = await _ctx.StoreSubscriptions.FirstOrDefaultAsync(s => s.OrderCode == orderCode && s.Status == 1);

                if (payment == null && sub == null) return NotFound(new { message = "Không tìm thấy giao dịch thanh toán hợp lệ cho mã này." });

                var targetDate = payment?.PaidAt ?? payment?.CreatedAt ?? sub?.CreatedAt;
                var targetId = payment?.Id.ToString() ?? sub?.Id.ToString();

                if (targetDate == null || targetId == null) return NotFound();

                bool expandedRange = false;
                var effectiveFrom = from.HasValue 
                    ? new DateTimeOffset(from.Value.Year, from.Value.Month, from.Value.Day, 0, 0, 0, TimeSpan.FromHours(7)).UtcDateTime 
                    : DateTime.UtcNow.AddMonths(-3);
                var effectiveTo = to.HasValue
                    ? new DateTimeOffset(to.Value.Year, to.Value.Month, to.Value.Day, 23, 59, 59, 999, TimeSpan.FromHours(7)).UtcDateTime
                    : DateTime.UtcNow.AddHours(7);

                if (targetDate < effectiveFrom || targetDate > effectiveTo)
                {
                    effectiveFrom = targetDate < effectiveFrom ? targetDate.Value.Date : effectiveFrom;
                    effectiveTo = targetDate > effectiveTo ? targetDate.Value.Date.AddDays(1) : effectiveTo;
                    expandedRange = true;
                }

                var orderPayments = await _ctx.Payments
                    .Include(p => p.Order)
                    .Where(p => p.Status == 1 && p.PaidAt >= effectiveFrom && p.PaidAt <= effectiveTo && p.Order != null && p.Order.OrderStatus != SaveFoodBackend.Models.Enums.OrderStatusEnum.Cancelled)
                    .ToListAsync();
        
                var subscriptions = await _ctx.StoreSubscriptions
                    .Where(s => s.Status == 1 && s.CreatedAt >= effectiveFrom && s.CreatedAt <= effectiveTo && s.OrderCode != null)
                    .ToListAsync();
        
                var allItems = orderPayments.Select(p => new { Id = p.Id.ToString(), Date = p.PaidAt ?? p.CreatedAt })
                    .Concat(subscriptions.Select(s => new { Id = s.Id.ToString(), Date = s.CreatedAt }))
                    .OrderByDescending(x => x.Date)
                    .ThenByDescending(x => x.Id)
                    .ToList();
        
                var index = allItems.FindIndex(x => x.Id == targetId);
                if (index == -1) return NotFound();
        
                var pageNumber = (index / pageSize) + 1;
        
                return Ok(new
                {
                    found = true,
                    pageNumber,
                    expandedDateRange = expandedRange,
                    effectiveFromDate = effectiveFrom,
                    effectiveToDate = effectiveTo,
                    highlightId = targetId
                });
            }

            if (type == "store_wallet_transaction" || type == "customer_wallet_transaction" || type == "withdrawal")
            {
                if (!Guid.TryParse(id, out var guidId)) return BadRequest();
                var effectiveFrom = from.HasValue 
                    ? new DateTimeOffset(from.Value.Year, from.Value.Month, from.Value.Day, 0, 0, 0, TimeSpan.FromHours(7)).UtcDateTime 
                    : DateTime.UtcNow.Date; // admin finance page defaults to today
                var effectiveTo = to.HasValue
                    ? new DateTimeOffset(to.Value.Year, to.Value.Month, to.Value.Day, 23, 59, 59, 999, TimeSpan.FromHours(7)).UtcDateTime
                    : DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

                DateTime? targetDate = null;
                bool expanded = false;

                if (type == "store_wallet_transaction" || type == "customer_wallet_transaction")
                {
                    if (type == "store_wallet_transaction")
                    {
                        var tx = await _ctx.WalletTransactions.FirstOrDefaultAsync(w => w.Id == guidId);
                        if (tx == null) return NotFound();
                        targetDate = tx.CreatedAt;
                    }
                    else
                    {
                        var cx = await _ctx.CustomerWalletTransactions.FirstOrDefaultAsync(w => w.Id == guidId);
                        if (cx == null) return NotFound();
                        targetDate = cx.CreatedAt;
                    }

                    if (targetDate < effectiveFrom || targetDate > effectiveTo)
                    {
                        effectiveFrom = targetDate < effectiveFrom ? targetDate.Value.Date : effectiveFrom;
                        effectiveTo = targetDate > effectiveTo ? targetDate.Value.Date.AddDays(1).AddTicks(-1) : effectiveTo;
                        expanded = true;
                    }
                    
                    var index = -1;
                    if (type == "store_wallet_transaction")
                    {
                        var allIds = await _ctx.WalletTransactions.Where(w => w.CreatedAt >= effectiveFrom && w.CreatedAt <= effectiveTo).OrderByDescending(w => w.CreatedAt).ThenByDescending(w => w.Id).Select(w => w.Id).ToListAsync();
                        index = allIds.FindIndex(i => i == guidId);
                    }
                    else
                    {
                        var allIds = await _ctx.CustomerWalletTransactions.Where(w => w.CreatedAt >= effectiveFrom && w.CreatedAt <= effectiveTo).OrderByDescending(w => w.CreatedAt).ThenByDescending(w => w.Id).Select(w => w.Id).ToListAsync();
                        index = allIds.FindIndex(i => i == guidId);
                    }
                    if (index == -1) return NotFound();
                    return Ok(new { found = true, pageNumber = (index / pageSize) + 1, highlightId = id, expandedDateRange = expanded, effectiveFromDate = effectiveFrom, effectiveToDate = effectiveTo });
                }
                else // withdrawal
                {
                    var w = await _ctx.WithdrawalRequests.FirstOrDefaultAsync(x => x.Id == guidId);
                    if (w == null) return NotFound();
                    targetDate = w.CreatedAt;
                    if (targetDate < effectiveFrom || targetDate > effectiveTo)
                    {
                        effectiveFrom = targetDate < effectiveFrom ? targetDate.Value.Date : effectiveFrom;
                        effectiveTo = targetDate > effectiveTo ? targetDate.Value.Date.AddDays(1).AddTicks(-1) : effectiveTo;
                        expanded = true;
                    }
                    
                    var query = _ctx.WithdrawalRequests.Where(x => x.CreatedAt >= effectiveFrom && x.CreatedAt <= effectiveTo);
                    if (!string.IsNullOrEmpty(statusFilter) && statusFilter != "all" && int.TryParse(statusFilter, out int sFilter))
                    {
                        query = query.Where(x => x.Status == sFilter);
                        if (w.Status != sFilter)
                        {
                            statusFilter = "all";
                            query = _ctx.WithdrawalRequests.Where(x => x.CreatedAt >= effectiveFrom && x.CreatedAt <= effectiveTo);
                        }
                    }

                    var allIds = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id).Select(x => x.Id).ToListAsync();
                    var index = allIds.FindIndex(i => i == guidId);
                    if (index == -1) return NotFound();
                    return Ok(new { found = true, pageNumber = (index / pageSize) + 1, highlightId = id, expandedDateRange = expanded, effectiveFromDate = effectiveFrom, effectiveToDate = effectiveTo, statusFilter = statusFilter });
                }
            }

            return BadRequest();
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
