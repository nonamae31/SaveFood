using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Hubs;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Services;

public class NotificationService : INotificationService
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationService(SaveFoodDbContext ctx, IHubContext<NotificationHub> hub)
    {
        _ctx = ctx;
        _hub = hub;
    }

    /// <summary>
    /// Lưu thông báo vào DB và đẩy real-time qua SignalR tới user.
    /// </summary>
    public async Task SendAsync(Guid userId, string title, string body, string type, Guid? referenceId = null)
    {
        // 1. Lưu vào DB
        var notification = new Notification
        {
            UserId      = userId,
            Title       = title,
            Body        = body,
            Type        = type,
            ReferenceId = referenceId,
            IsRead      = false,
            CreatedAt   = DateTime.UtcNow
        };
        _ctx.Notifications.Add(notification);
        await _ctx.SaveChangesAsync();

        // 2. Push real-time qua SignalR (không throw nếu user offline)
        try
        {
            await _hub.Clients
                .Group($"User_{userId}")
                .SendAsync("ReceiveNotification", new
                {
                    id          = notification.Id,
                    title       = notification.Title,
                    body        = notification.Body,
                    type        = notification.Type,
                    referenceId = notification.ReferenceId,
                    isRead      = notification.IsRead,
                    createdAt   = notification.CreatedAt
                });
        }
        catch
        {
            // User đang offline → không cần làm gì, đã lưu DB rồi
        }
    }

    public async Task<(List<Notification> Items, int Total)> GetByUserAsync(Guid userId, int page, int pageSize)
    {
        var query = _ctx.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _ctx.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _ctx.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null) return false;

        notification.IsRead = true;
        await _ctx.SaveChangesAsync();
        return true;
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _ctx.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }
}
