using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Common;
using System.Security.Claims;

namespace SaveFoodBackend.Controllers;

/// <summary>
/// Base Controller dùng chung cho tất cả API Controller trong SaveFood.
/// MỌI Controller cụ thể (ProductsController, StoresController...) phải kế thừa lớp này.
/// 
/// Cung cấp:
/// - Các helper method để trả về ApiResponse chuẩn (OkResponse, CreatedResponse, NoContentResponse)
/// - Properties để đọc thông tin người dùng hiện tại từ JWT Token
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    // ─── Helpers để đọc thông tin người dùng từ JWT Token ─────────────────────
    // TẠM THỜI: Khi chưa kích hoạt Auth, hệ thống sẽ trả về MOCK DATA để các thành viên khác
    // có thể code và test API ngay lập tức mà không bị lỗi UnauthorizedException.

    /// <summary>ID của người dùng đang đăng nhập. Có Mock dữ liệu nếu chưa xác thực.</summary>
    protected Guid? CurrentUserId
    {
        get
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (claim != null) return Guid.Parse(claim);

            // Mock User ID mặc định cho môi trường Dev (Khi chưa có Auth)
            return Guid.Parse("00000000-0000-0000-0000-000000000001");
        }
    }

    /// <summary>Email của người dùng đang đăng nhập. Có Mock dữ liệu nếu chưa xác thực.</summary>
    protected string? CurrentUserEmail => User.FindFirstValue(ClaimTypes.Email) ?? "test_member@savefood.vn";

    /// <summary>
    /// ID cửa hàng của người dùng đang đăng nhập (chỉ có giá trị nếu role là StoreOwner).
    /// Có Mock dữ liệu nếu chưa xác thực.
    /// </summary>
    protected Guid? CurrentStoreId
    {
        get
        {
            var claim = User.FindFirstValue("storeId");
            if (!string.IsNullOrEmpty(claim)) return Guid.Parse(claim);

            // Mock Store ID mặc định cho môi trường Dev (Khi chưa có Auth)
            return Guid.Parse("00000000-0000-0000-0000-000000000002");
        }
    }

    /// <summary>
    /// Lấy CurrentStoreId và throw UnauthorizedException nếu null.
    /// Dùng trong các action yêu cầu phải là StoreOwner.
    /// </summary>
    protected Guid GetRequiredStoreId()
        => CurrentStoreId ?? throw new Common.Exceptions.UnauthorizedException("Tài khoản của bạn không liên kết với cửa hàng nào.");

    /// <summary>
    /// Lấy CurrentUserId và throw UnauthorizedException nếu null.
    /// </summary>
    protected Guid GetRequiredUserId()
        => CurrentUserId ?? throw new Common.Exceptions.UnauthorizedException();

    // ─── Helper methods để trả về ApiResponse chuẩn ───────────────────────────

    /// <summary>Trả về HTTP 200 OK kèm data.</summary>
    protected IActionResult OkResponse<T>(T data, string message = "Thành công")
        => Ok(ApiResponse<T>.Ok(data, message));

    /// <summary>Trả về HTTP 200 OK không kèm data.</summary>
    protected IActionResult OkResponse(string message = "Thành công")
        => Ok(ApiResponse.OkEmpty(message));

    /// <summary>Trả về HTTP 201 Created kèm location header và data.</summary>
    protected IActionResult CreatedResponse<T>(string actionName, object routeValues, T data, string message = "Tạo mới thành công")
        => CreatedAtAction(actionName, routeValues, ApiResponse<T>.Ok(data, message));

    /// <summary>Trả về HTTP 204 No Content (dùng sau khi xóa thành công).</summary>
    protected IActionResult NoContentResponse()
        => NoContent();

    /// <summary>Trả về HTTP 400 Bad Request kèm message lỗi.</summary>
    protected IActionResult BadRequestResponse(string message)
        => BadRequest(ApiResponse.Fail(message));
}
