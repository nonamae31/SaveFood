using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SaveFoodBackend.Application.Orders.Events;
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
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        // Threshold for late order: Current time is 1 hour past the ExpectedPickupTime
        var thresholdTime = DateTime.UtcNow.AddHours(-1);

        // Find orders that are Pending, Confirmed, or ReadyForPickup, and past ExpectedPickupTime
        var lateOrders = await ctx.Orders
            .Include(o => o.Store)
                .ThenInclude(s => s.StoreWallet)
            .Include(o => o.Payment)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Listing)
            .Where(o => (o.OrderStatus == SaveFoodBackend.Models.Enums.OrderStatusEnum.Pending || o.OrderStatus == SaveFoodBackend.Models.Enums.OrderStatusEnum.Confirmed || o.OrderStatus == SaveFoodBackend.Models.Enums.OrderStatusEnum.ReadyForPickup) 
                        && o.ExpectedPickupTime.HasValue 
                        && o.ExpectedPickupTime.Value < thresholdTime)
            .ToListAsync(cancellationToken);

        if (lateOrders.Any())
        {
            foreach (var order in lateOrders)
            {
                if (order.OrderStatus == SaveFoodBackend.Models.Enums.OrderStatusEnum.Pending)
                {
                    // Store never confirmed it. Customer didn't receive it.
                    // Cancel order and refund customer.
                    order.OrderStatus = SaveFoodBackend.Models.Enums.OrderStatusEnum.Cancelled; // Cancelled

                    // Restore stock
                    foreach (var item in order.OrderItems)
                    {
                        if (item.Listing != null)
                        {
                            item.Listing.QuantityAvailable += item.Quantity;
                        }
                    }

                    // Process Refund if paid
                    if (order.Payment != null && order.Payment.Status == 1) // Paid
                    {
                        var customerWallet = await ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == order.UserId, cancellationToken);
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
                        customerWallet.UpdatedAt = DateTime.UtcNow;

                        ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
                        {
                            Id = Guid.NewGuid(),
                            CustomerWalletId = customerWallet.Id,
                            Amount = order.TotalAmount,
                            Type = 0, // Refund
                            Status = 1, // Completed
                            OrderId = order.Id,
                            CreatedAt = DateTime.UtcNow,
                            Description = $"Hoàn tiền tự động do cửa hàng không xác nhận đơn hàng {order.OrderCode ?? 0}"
                        });
                    }
                }
                else // Status 1 or 2
                {
                    order.OrderStatus = SaveFoodBackend.Models.Enums.OrderStatusEnum.Completed; // Delivered
                    // Process store wallet (add money to store - minus 5% platform fee)
                    if (order.Store?.StoreWallet != null)
                    {
                        decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
                        decimal storeIncome = order.TotalAmount - platformFee;

                        order.Store.StoreWallet.AvailableBalance += storeIncome;
                        
                        ctx.WalletTransactions.Add(new WalletTransaction
                        {
                            Id = Guid.NewGuid(),
                            StoreWalletId = order.Store.StoreWallet.Id,
                            OrderId = order.Id,
                            Amount = order.TotalAmount,
                            Type = 1, // Income
                            Status = 1, // Completed
                            Description = $"Doanh thu từ đơn hàng {order.OrderCode ?? 0} (Khách không lấy)"
                        });
                        
                        ctx.WalletTransactions.Add(new WalletTransaction
                        {
                            Id = Guid.NewGuid(),
                            StoreWalletId = order.Store.StoreWallet.Id,
                            OrderId = order.Id,
                            Amount = platformFee,
                            Type = 2, // Platform Fee
                            Status = 1, // Completed
                            Description = $"Phí nền tảng (5%) từ đơn hàng {order.OrderCode ?? 0} (Khách không lấy)"
                        });
                    }
                }
            }

            await ctx.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"Auto-processed {lateOrders.Count} late orders.");

            // Publish AutoNoShow events — VoucherAccrualHandler will skip these
            foreach (var order in lateOrders)
            {
                await mediator.Publish(new OrderCompletedEvent(
                    OrderId: order.Id,
                    CustomerId: order.UserId,
                    OrderTotal: order.TotalAmount,
                    Source: OrderCompletionSource.AutoNoShow), cancellationToken);
            }
        }
    }
}
