namespace SaveFoodBackend.Models;

/// <summary>
/// Thông báo gửi tới User trong hệ thống.
/// Được tạo tự động khi có sự kiện: đặt hàng, thanh toán, duyệt Store, rút tiền, đánh giá...
/// </summary>
public class Notification
{
    /// <summary>Primary Key dạng GUID.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>User nhận thông báo.</summary>
    public Guid UserId { get; set; }

    /// <summary>Tiêu đề ngắn gọn của thông báo.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Nội dung chi tiết của thông báo.</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// Loại sự kiện tạo ra thông báo. Dùng để phân biệt icon và routing ở Frontend.
    /// Các giá trị: ORDER_PLACED, ORDER_STATUS_CHANGED, PAYMENT_SUCCESS, PAYMENT_FAILED,
    ///              STORE_APPROVED, STORE_REJECTED, WITHDRAWAL_PROCESSED,
    ///              NEW_REVIEW, REVIEW_REPLIED
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// ID của entity liên quan (Order ID, Store ID, WithdrawalRequest ID, Review ID...).
    /// Dùng để điều hướng khi user click vào thông báo.
    /// </summary>
    public Guid? ReferenceId { get; set; }

    /// <summary>Đã đọc chưa. Mặc định = false.</summary>
    public bool IsRead { get; set; } = false;

    /// <summary>Thời điểm tạo thông báo (UTC).</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual User? User { get; set; }
}
