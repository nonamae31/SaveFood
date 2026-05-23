namespace SaveFoodBackend.Common;

/// <summary>
/// Result pattern — dùng để Service layer trả về kết quả mà không throw exception.
/// Controller sẽ kiểm tra IsSuccess để quyết định HTTP status code.
/// </summary>
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? ErrorMessage { get; }
    public string? ErrorCode { get; }

    private Result(T value)
    {
        IsSuccess = true;
        Value = value;
    }

    private Result(string errorMessage, string errorCode = "UNKNOWN_ERROR")
    {
        IsSuccess = false;
        ErrorMessage = errorMessage;
        ErrorCode = errorCode;
    }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string message, string code = "UNKNOWN_ERROR") => new(message, code);

    /// <summary>Map kết quả sang kiểu khác.</summary>
    public Result<TOut> Map<TOut>(Func<T, TOut> mapper)
        => IsSuccess ? Result<TOut>.Success(mapper(Value!)) : Result<TOut>.Failure(ErrorMessage!, ErrorCode!);
}

/// <summary>Result không có value (dùng cho Delete, Update không cần trả dữ liệu).</summary>
public class Result
{
    public bool IsSuccess { get; }
    public string? ErrorMessage { get; }
    public string? ErrorCode { get; }

    private Result(bool isSuccess, string? errorMessage = null, string? errorCode = null)
    {
        IsSuccess = isSuccess;
        ErrorMessage = errorMessage;
        ErrorCode = errorCode;
    }

    public static Result Success() => new(true);
    public static Result Failure(string message, string code = "UNKNOWN_ERROR") => new(false, message, code);
}
