using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SaveFoodBackend.Data;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Services.BackgroundTasks;

public class NoShowOrderCompletionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NoShowOrderCompletionService> _logger;

    public NoShowOrderCompletionService(IServiceProvider serviceProvider, ILogger<NoShowOrderCompletionService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NoShowOrderCompletionService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CompleteNoShowOrdersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing NoShowOrderCompletionService.");
            }

            // Run every 10 minutes
            await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
        }
    }

    private async Task CompleteNoShowOrdersAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<SaveFoodDbContext>();

        // Threshold for No-Show: Current time is 1 hour past the ExpectedPickupTime
        var thresholdTime = DateTime.UtcNow.AddHours(-1);

        // Find orders that are Paid (OrderStatus = 1) and past ExpectedPickupTime
        var lateOrders = await ctx.Orders
            .Include(o => o.Store)
                .ThenInclude(s => s.StoreWallet)
            .Where(o => o.OrderStatus == 1 && o.ExpectedPickupTime.HasValue && o.ExpectedPickupTime.Value < thresholdTime)
            .ToListAsync(cancellationToken);

        if (lateOrders.Any())
        {
            foreach (var order in lateOrders)
            {
                order.OrderStatus = 2; // Completed / Delivered

                // Process store wallet (add money to store - minus 5% platform fee)
                if (order.Store?.StoreWallet != null)
                {
                    decimal platformFee = order.TotalAmount * 0.05m;
                    decimal storeIncome = order.TotalAmount - platformFee;

                    order.Store.StoreWallet.AvailableBalance += storeIncome;
                    
                    ctx.WalletTransactions.Add(new WalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        StoreWalletId = order.Store.StoreWallet.Id,
                        OrderId = order.Id,
                        Amount = storeIncome,
                        Type = 1, // Income
                        Status = 1, // Completed
                        Description = $"Thu nhập từ đơn hàng {order.OrderCode ?? 0} (No-Show, Đã trừ 5% phí)"
                    });
                }
            }

            await ctx.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"Auto-completed {lateOrders.Count} No-Show orders and paid stores.");
        }
    }
}
