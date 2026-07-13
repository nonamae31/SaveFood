using System;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services.BackgroundTasks;

public class NotificationQueue : INotificationQueue
{
    private readonly Channel<NotificationMessage> _queue;

    public NotificationQueue()
    {
        var options = new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<NotificationMessage>(options);
    }

    public async ValueTask QueueNotificationAsync(NotificationMessage message, CancellationToken cancellationToken = default)
    {
        await _queue.Writer.WriteAsync(message, cancellationToken);
    }

    public async ValueTask<NotificationMessage> DequeueAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}
