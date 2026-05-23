namespace SaveFoodBackend.Common.Exceptions;

/// <summary>
/// Exception base cho tất cả lỗi nghiệp vụ của SaveFood.
/// GlobalExceptionMiddleware sẽ bắt lớp này và map sang HTTP 422 Unprocessable Entity.
/// </summary>
public class BusinessException : Exception
{
    public string ErrorCode { get; }
    public int HttpStatusCode { get; }

    public BusinessException(string message, string errorCode = "BUSINESS_ERROR", int httpStatusCode = 422)
        : base(message)
    {
        ErrorCode = errorCode;
        HttpStatusCode = httpStatusCode;
    }
}
