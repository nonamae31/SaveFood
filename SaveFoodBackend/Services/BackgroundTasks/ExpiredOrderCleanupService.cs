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
            .Include(o => o.Payment)
            .Where(o => o.OrderStatus == SaveFoodBackend.Models.Enums.OrderStatusEnum.Pending && o.ReservationExpiresAt.HasValue && o.ReservationExpiresAt.Value < now)
            .ToListAsync(cancellationToken);

        if (expiredOrders.Any())
        {
            foreach (var order in expiredOrders)
            {
                order.OrderStatus = SaveFoodBackend.Models.Enums.OrderStatusEnum.Cancelled; // Cancelled
                order.ReservationExpiresAt = null; // Clear expiration

                // Restore stock
                foreach (var item in order.OrderItems)
                {
                    if (item.Listing != null)
                    {
                        item.Listing.QuantityAvailable += item.Quantity;
                    }
                }

                // Process Refund if paid
                if (order.Payment != null && order.Payment.Status == (byte)PaymentStatusEnum.Paid)
                {
                    decimal refundAmount = order.Payment.Amount;
                    if (refundAmount > 0)
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

                        customerWallet.Balance += refundAmount;
                        customerWallet.UpdatedAt = DateTime.UtcNow;

                        ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
                        {
                            Id = Guid.NewGuid(),
                            CustomerWalletId = customerWallet.Id,
                            Amount = refundAmount,
                            Type = 0, // Refund / Deposit
                            Status = 1, // Completed
                            OrderId = order.Id,
                            CreatedAt = DateTime.UtcNow,
                            Description = $"Hoàn tiền tự động cho đơn hàng hết hạn {order.OrderCode ?? 0}"
                        });
                    }
                }

                if (order.VoucherDiscount > 0)
                {
                    var voucherFund = await ctx.CustomerVoucherFunds.FirstOrDefaultAsync(v => v.CustomerId == order.UserId, cancellationToken);
                    if (voucherFund != null)
                    {
                        bool isPaid = order.Payment != null && order.Payment.Status == (byte)PaymentStatusEnum.Paid;
                        if (isPaid)
                        {
                            voucherFund.AccumulatedBalance += order.VoucherDiscount;
                            ctx.CustomerVoucherTransactions.Add(new CustomerVoucherTransaction
                            {
                                Id = Guid.NewGuid(),
                                CustomerVoucherFundId = voucherFund.Id,
                                OrderId = order.Id,
                                Amount = order.VoucherDiscount, // Positive
                                OrderTotal = order.TotalAmount,
                                Type = 3, // Refunded
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                        else
                        {
                            // Just release the hold
                            voucherFund.ReservedAmount = Math.Max(0, voucherFund.ReservedAmount - order.VoucherDiscount);
                        }
                    }
                }
            }

            await ctx.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"Cancelled {expiredOrders.Count} expired orders and restored stock.");
        }
    }
}
