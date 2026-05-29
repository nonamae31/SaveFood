using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SaveFoodBackend.Data;

namespace SaveFoodBackend.Services.BackgroundTasks;

public class ExpiredOrderCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpiredOrderCleanupService> _logger;

    public ExpiredOrderCleanupService(IServiceProvider serviceProvider, ILogger<ExpiredOrderCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ExpiredOrderCleanupService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredOrdersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing ExpiredOrderCleanupService.");
            }

            // Run every 1 minute
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task CleanupExpiredOrdersAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<SaveFoodDbContext>();

        var now = DateTime.UtcNow;

        // Find orders that are Pending (Status 0) and expired
        var expiredOrders = await ctx.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Listing)
            .Where(o => o.OrderStatus == 0 && o.ReservationExpiresAt.HasValue && o.ReservationExpiresAt.Value < now)
            .ToListAsync(cancellationToken);

        if (expiredOrders.Any())
        {
            foreach (var order in expiredOrders)
            {
                order.OrderStatus = 4; // Cancelled (assuming 4 is Cancelled)
                order.ReservationExpiresAt = null; // Clear expiration

                // Restore stock
                foreach (var item in order.OrderItems)
                {
                    if (item.Listing != null)
                    {
                        item.Listing.QuantityAvailable += item.Quantity;
                    }
                }
            }

            await ctx.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"Cancelled {expiredOrders.Count} expired orders and restored stock.");
        }
    }
}
