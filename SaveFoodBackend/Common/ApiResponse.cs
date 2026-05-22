namespace SaveFoodBackend.Common;

/// <summary>
/// Chuẩn hóa định dạng JSON trả về cho tất cả API endpoint.
/// Mọi Controller PHẢI dùng lớp này thay vì trả về dữ liệu thô.
/// Format: { "success": true, "message": "...", "data": {...} }
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public T? Data { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    /// <summary>Trả về phản hồi thành công kèm dữ liệu.</summary>
    public static ApiResponse<T> Ok(T data, string message = "Thành công")
        => new() { Success = true, Data = data, Message = message };

    /// <summary>Trả về phản hồi thành công không kèm dữ liệu (ví dụ: Delete).</summary>
    public static ApiResponse<T> Ok(string message = "Thành công")
        => new() { Success = true, Message = message };

    /// <summary>Trả về phản hồi lỗi.</summary>
    public static ApiResponse<T> Fail(string message)
        => new() { Success = false, Message = message };
}

/// <summary>Phiên bản không generic, dùng khi không cần trả về data.</summary>
public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse OkEmpty(string message = "Thành công")
        => new() { Success = true, Message = message };

    public static new ApiResponse Fail(string message)
        => new() { Success = false, Message = message };
}
