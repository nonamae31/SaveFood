using Microsoft.IdentityModel.Tokens;
using SaveFoodBackend.Common;
using SaveFoodBackend.Common.Exceptions;
using System.Text.Json;

namespace SaveFoodBackend.Middleware;

/// <summary>
/// Middleware bắt lỗi toàn cục — xử lý mọi Exception chưa được catch và trả về JSON chuẩn.
/// 
/// Thứ tự ưu tiên khi match exception:
/// 1. ValidationException → 400 Bad Request
/// 2. UnauthorizedException → 401 Unauthorized
/// 3. ForbiddenException → 403 Forbidden
/// 4. NotFoundException → 404 Not Found
/// 5. BusinessException (mọi lớp con khác) → HTTP code theo exception
/// 6. SecurityTokenExpiredException → 401 (JWT hết hạn)
/// 7. UnauthorizedAccessException → 403
/// 8. Exception → 500 Internal Server Error
/// 
/// ⚠️ QUAN TRỌNG: KHÔNG BAO GIỜ bắt exception trong Controller rồi bỏ qua (swallow).
/// Hãy throw và để Middleware này xử lý.
/// </summary>
public class GlobalExceptionMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionMiddleware> logger,
    IWebHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Ghi log ra file để debug nhanh
        System.IO.File.WriteAllText("error_log.txt", exception.ToString());

        // Log lỗi — luôn ghi log đầy đủ cho debugging
        if (exception is BusinessException)
            logger.LogWarning(exception, "Business exception: {Message}", exception.Message);
        else
            logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

        var (statusCode, errorCode, message) = exception switch
        {
            // Lỗi xác thực dữ liệu đầu vào
            ValidationException ve => (400, ve.ErrorCode, ve.Message),

            // Lỗi chưa xác thực / JWT hết hạn
            UnauthorizedException ue => (401, ue.ErrorCode, ue.Message),
            SecurityTokenExpiredException => (401, "TOKEN_EXPIRED", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),

            // Lỗi không có quyền
            // ForbiddenException fe => (403, fe.ErrorCode, fe.Message),
            UnauthorizedAccessException => (403, "FORBIDDEN", exception.Message),

            // Lỗi không tìm thấy
            NotFoundException nfe => (404, nfe.ErrorCode, nfe.Message),

            // Lỗi nghiệp vụ khác (BusinessException và các subclass)
            BusinessException be => (be.HttpStatusCode, be.ErrorCode, be.Message),
            ArgumentException ae => (400, "BAD_REQUEST", ae.Message),
            InvalidOperationException ioe => (400, "BAD_REQUEST", ioe.Message),

            // Lỗi hệ thống không xác định
            _ => (500, "SERVER_ERROR", env.IsDevelopment()
                ? exception.Message  // Hiện lỗi thật khi dev để dễ debug
                : "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

            // Xây dựng response body
            var response = new
            {
                success = false,
                message,
                errorCode,
                timestamp = DateTime.UtcNow,
                // Tạm thời bật stack trace để xem lỗi 500 trên server
                detail = exception.ToString()
            };

        // Ghi response body vào HTTP response
        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
