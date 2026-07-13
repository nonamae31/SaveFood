using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services.BackgroundTasks;

public class NotificationBackgroundService : BackgroundService
{
    private readonly INotificationQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationBackgroundService> _logger;

    public NotificationBackgroundService(INotificationQueue queue, IServiceScopeFactory scopeFactory, ILogger<NotificationBackgroundService> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var message = await _queue.DequeueAsync(stoppingToken);
                
                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                
                await notificationService.SendAsync(message.UserId, message.Title, message.Body, message.Type, message.ReferenceId);
            }
            catch (OperationCanceledException)
            {
                // Prevent throwing if stoppingToken was signaled
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred processing notification queue.");
            }
        }
    }
}
