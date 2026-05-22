namespace SaveFoodBackend.Common.Exceptions;

/// <summary>
/// Ném khi không tìm thấy tài nguyên trong DB.
/// GlobalExceptionMiddleware sẽ map thành HTTP 404.
/// Cách dùng: throw new NotFoundException($"Sản phẩm {id} không tồn tại.");
/// </summary>
public class NotFoundException : BusinessException
{
    public NotFoundException(string message)
        : base(message, "NOT_FOUND", 404)
    {
    }

    public NotFoundException(string entityName, Guid id)
        : base($"{entityName} với ID {id} không tồn tại.", "NOT_FOUND", 404)
    {
    }
}
