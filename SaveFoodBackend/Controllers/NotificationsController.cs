using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Common;
using SaveFoodBackend.Interfaces;
using System.Security.Claims;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifService;

    public NotificationsController(INotificationService notifService)
    {
        _notifService = notifService;
    }

    private Guid GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
    }

    /// <summary>Lấy danh sách thông báo của user hiện tại (phân trang).</summary>
    /// <param name="page">Trang (mặc định 1)</param>
    /// <param name="pageSize">Số lượng mỗi trang (mặc định 20)</param>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        pageSize = Math.Clamp(pageSize, 1, 50);
        var (items, total) = await _notifService.GetByUserAsync(userId, page, pageSize);

        return Ok(new
        {
            items,
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize)
        });
    }

    /// <summary>Lấy số lượng thông báo chưa đọc.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var count = await _notifService.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    /// <summary>Đánh dấu một thông báo là đã đọc.</summary>
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var success = await _notifService.MarkAsReadAsync(id, userId);
        if (!success) return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy thông báo." });

        return Ok(new ApiResponse { Success = true, Message = "Đã đánh dấu đã đọc." });
    }

    /// <summary>Đánh dấu tất cả thông báo của user là đã đọc.</summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        await _notifService.MarkAllAsReadAsync(userId);
        return Ok(new ApiResponse { Success = true, Message = "Đã đánh dấu tất cả đã đọc." });
    }
}
