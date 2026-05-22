namespace SaveFoodBackend.Common.Exceptions;

/// <summary>
/// Ném khi người dùng chưa xác thực hoặc token không hợp lệ.
/// GlobalExceptionMiddleware sẽ map thành HTTP 401.
/// </summary>
public class UnauthorizedException : BusinessException
{
    public UnauthorizedException(string message = "Bạn cần đăng nhập để thực hiện thao tác này.")
        : base(message, "UNAUTHORIZED", 401)
    {
    }
}

/// <summary>
/// Ném khi người dùng đã xác thực nhưng không có quyền thực hiện hành động.
/// GlobalExceptionMiddleware sẽ map thành HTTP 403.
/// </summary>
public class ForbiddenException : BusinessException
{
    public ForbiddenException(string message = "Bạn không có quyền thực hiện thao tác này.")
        : base(message, "FORBIDDEN", 403)
    {
    }
}

/// <summary>
/// Ném khi dữ liệu đầu vào không hợp lệ (thay thế cho DataAnnotation exceptions).
/// GlobalExceptionMiddleware sẽ map thành HTTP 400.
/// </summary>
public class ValidationException : BusinessException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(string message)
        : base(message, "VALIDATION_ERROR", 400)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("Dữ liệu đầu vào không hợp lệ.", "VALIDATION_ERROR", 400)
    {
        Errors = new Dictionary<string, string[]>(errors);
    }
}
