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
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services.BackgroundTasks;

public class AutoCancelUnconfirmedOrdersService : BackgroundService
{
    private readonly ILogger<AutoCancelUnconfirmedOrdersService> _logger;
    private readonly IServiceProvider _serviceProvider;

    public AutoCancelUnconfirmedOrdersService(ILogger<AutoCancelUnconfirmedOrdersService> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AutoCancelUnconfirmedOrdersService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var ctx = scope.ServiceProvider.GetRequiredService<SaveFoodDbContext>();

                var oneHourAgo = DateTime.UtcNow.AddHours(-1);

                // Find unconfirmed orders older than 1 hour
                var unconfirmedOrders = await ctx.Orders
                    .Include(o => o.OrderItems)
                    .Include(o => o.Payment)
                    .Where(o => o.OrderStatus == OrderStatusEnum.Pending && o.CreatedAt < oneHourAgo)
                    .ToListAsync(stoppingToken);

                foreach (var order in unconfirmedOrders)
                {
                    // Refund to customer wallet if paid
                    bool isPaid = false;
                    if (order.Payment != null)
                    {
                        if (order.Payment.PaymentMethod == 0) // Wallet
                            isPaid = true;
                        else if (order.Payment.PaymentMethod == 1 && order.Payment.Status == 1) // PayOS Paid
                            isPaid = true;
                    }

                    if (isPaid)
                    {
                        var customerWallet = await ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == order.UserId, stoppingToken);
                        if (customerWallet == null)
                        {
                            customerWallet = new CustomerWallet
                            {
                                Id = Guid.NewGuid(),
                                UserId = order.UserId,
                                Balance = 0,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            ctx.CustomerWallets.Add(customerWallet);
                        }

                        customerWallet.Balance += order.TotalAmount;

                        var storeWallet = await ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, stoppingToken);
                        if (storeWallet != null)
                        {
                            decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
                            decimal storeIncome = order.TotalAmount - platformFee;
                            storeWallet.PendingBalance = Math.Max(0, storeWallet.PendingBalance - storeIncome);
                        }

                        ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
                        {
                            Id = Guid.NewGuid(),
                            CustomerWalletId = customerWallet.Id,
                            Amount = order.TotalAmount,
                            Type = 3, // Refund
                            Status = 1, // Completed
                            OrderId = order.Id,
                            Description = $"Hoàn tiền hệ thống tự hủy đơn {order.OrderCode ?? 0}"
                        });
                    }

                    // Return stock
                    foreach (var item in order.OrderItems)
                    {
                        var listing = await ctx.ClearanceListings.FindAsync(new object[] { item.ListingId }, stoppingToken);
                        if (listing != null)
                        {
                            listing.QuantityAvailable += item.Quantity;
                        }
                    }

                    order.OrderStatus = OrderStatusEnum.Cancelled;
                }

                if (unconfirmedOrders.Any())
                {
                    await ctx.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation($"Auto-cancelled {unconfirmedOrders.Count} unconfirmed orders.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing AutoCancelUnconfirmedOrdersService.");
            }

            // Run every 5 minutes
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
