using System;
using System.Threading;
using System.Threading.Tasks;

namespace SaveFoodBackend.Interfaces;

public class NotificationMessage
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public string Type { get; set; } = null!;
    public Guid? ReferenceId { get; set; }
}

public interface INotificationQueue
{
    ValueTask QueueNotificationAsync(NotificationMessage message, CancellationToken cancellationToken = default);
    ValueTask<NotificationMessage> DequeueAsync(CancellationToken cancellationToken);
}
