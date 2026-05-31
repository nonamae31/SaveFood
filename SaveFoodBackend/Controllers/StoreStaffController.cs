using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[Route("api/stores/{storeId}/staff")]
[ApiController]
[Authorize]
public class StoreStaffController : ApiControllerBase
{
    private readonly IStoreStaffService _staffService;

    public StoreStaffController(IStoreStaffService staffService)
    {
        _staffService = staffService;
    }

    // GET: api/stores/{storeId}/staff
    /// <summary>Lấy danh sách nhân viên của một cửa hàng. Yêu cầu người dùng là thành viên của cửa hàng đó.</summary>
    [HttpGet]
    public async Task<IActionResult> GetStoreStaff(Guid storeId, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var staff = await _staffService.GetStoreStaffAsync(storeId, userId, ct);
            return OkResponse(staff);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống.", details = ex.Message });
        }
    }

    // POST: api/stores/{storeId}/staff
    /// <summary>Thêm một User vào cửa hàng với vai trò Staff. Chỉ Owner mới có quyền thực hiện.</summary>
    [HttpPost]
    public async Task<IActionResult> AddStoreStaff(Guid storeId, [FromBody] AddStoreStaffRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var userId = GetRequiredUserId();
            var newStaff = await _staffService.AddStaffAsync(storeId, userId, request, ct);
            return OkResponse(newStaff, "Thêm nhân viên thành công!");
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống.", details = ex.Message });
        }
    }

    // DELETE: api/stores/{storeId}/staff/{targetUserId}
    /// <summary>Xóa một Staff khỏi cửa hàng. Chỉ Owner mới có quyền thực hiện. Thu hồi quyền Store nếu User không còn làm việc cho cửa hàng nào khác.</summary>
    [HttpDelete("{targetUserId}")]
    public async Task<IActionResult> RemoveStoreStaff(Guid storeId, Guid targetUserId, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            await _staffService.RemoveStaffAsync(storeId, userId, targetUserId, ct);
            return NoContentResponse();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống.", details = ex.Message });
        }
    }
}
