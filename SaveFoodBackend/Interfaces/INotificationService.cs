namespace SaveFoodBackend.Interfaces;

/// <summary>
/// Service gửi và quản lý thông báo trong hệ thống.
/// Lưu thông báo vào DB và đẩy real-time qua SignalR.
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Tạo và gửi thông báo tới một user cụ thể.
    /// Lưu vào DB + đẩy real-time qua SignalR.
    /// </summary>
    Task SendAsync(Guid userId, string title, string body, string type, Guid? referenceId = null);

    /// <summary>
    /// Lấy danh sách thông báo của user hiện tại (phân trang).
    /// </summary>
    Task<(List<SaveFoodBackend.Models.Notification> Items, int Total)> GetByUserAsync(Guid userId, int page, int pageSize);

    /// <summary>
    /// Đếm số thông báo chưa đọc của user.
    /// </summary>
    Task<int> GetUnreadCountAsync(Guid userId);

    /// <summary>
    /// Đánh dấu một thông báo là đã đọc.
    /// </summary>
    Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId);

    /// <summary>
    /// Đánh dấu tất cả thông báo của user là đã đọc.
    /// </summary>
    Task MarkAllAsReadAsync(Guid userId);
}
