using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SaveFoodBackend.Application.Orders.Events;
using SaveFoodBackend.Data;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Application.Orders.Handlers;

/// <summary>
/// Handles the 2% voucher accrual on order completion.
/// Only fires for <see cref="OrderCompletionSource.StaffScan"/> orders.
///
/// Race-condition safety:
///   - <see cref="AccumulatedBalance"/> and <see cref="TotalEarned"/> are updated via
///     ExecuteUpdateAsync (atomic SQL UPDATE) — no lost-update risk.
///   - The INSERT of <see cref="CustomerVoucherTransaction"/> is protected by a DB-level
///     UNIQUE constraint on OrderId, so duplicate publishes (e.g., retries) are silently
///     swallowed rather than throwing.
/// </summary>
public class VoucherAccrualHandler : INotificationHandler<OrderCompletedEvent>
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VoucherAccrualHandler> _logger;

    private const decimal VoucherRate = 0.02m;

    public VoucherAccrualHandler(IServiceProvider serviceProvider, ILogger<VoucherAccrualHandler> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task Handle(OrderCompletedEvent notification, CancellationToken cancellationToken)
    {
        // Only accrue voucher for staff-scanned completions.
        if (notification.Source == OrderCompletionSource.AutoNoShow)
        {
            _logger.LogDebug("VoucherAccrualHandler: skipping AutoNoShow order {OrderId}", notification.OrderId);
            return;
        }

        var voucherAmount = Math.Round(notification.OrderTotal * VoucherRate, 0, MidpointRounding.AwayFromZero);
        if (voucherAmount <= 0)
        {
            _logger.LogWarning("VoucherAccrualHandler: computed voucherAmount=0 for order {OrderId} (total={Total}). Skipping.",
                notification.OrderId, notification.OrderTotal);
            return;
        }

        // Use a fresh scope — this handler may be called from a BackgroundService
        // that already has its own scope lifetime.
        using var scope = _serviceProvider.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<SaveFoodDbContext>();

        try
        {
            // ── Step 1: Upsert CustomerVoucherFund ──────────────────────────────────
            var fund = await ctx.CustomerVoucherFunds
                .FirstOrDefaultAsync(f => f.CustomerId == notification.CustomerId, cancellationToken);

            if (fund == null)
            {
                fund = new CustomerVoucherFund
                {
                    Id = Guid.NewGuid(),
                    CustomerId = notification.CustomerId,
                    AccumulatedBalance = 0,
                    TotalEarned = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                ctx.CustomerVoucherFunds.Add(fund);
                await ctx.SaveChangesAsync(cancellationToken);
            }

            // ── Step 2: Insert ledger entry ─────────────────────────────────────────
            // If this throws DbUpdateException due to UNIQUE violation on OrderId,
            // it means we already processed this event — silently ignore.
            ctx.CustomerVoucherTransactions.Add(new CustomerVoucherTransaction
            {
                Id = Guid.NewGuid(),
                CustomerVoucherFundId = fund.Id,
                OrderId = notification.OrderId,
                Amount = voucherAmount,
                OrderTotal = notification.OrderTotal,
                Type = 1, // Credit
                CreatedAt = DateTime.UtcNow
            });
            await ctx.SaveChangesAsync(cancellationToken);

            // ── Step 3: Atomic balance update (ExecuteUpdateAsync avoids lost-update) ──
            await ctx.CustomerVoucherFunds
                .Where(f => f.CustomerId == notification.CustomerId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(f => f.AccumulatedBalance, f => f.AccumulatedBalance + voucherAmount)
                    .SetProperty(f => f.TotalEarned, f => f.TotalEarned + voucherAmount)
                    .SetProperty(f => f.UpdatedAt, DateTime.UtcNow),
                    cancellationToken);

            _logger.LogInformation(
                "VoucherAccrual: +{Amount}đ credited to customer {CustomerId} for order {OrderId}",
                voucherAmount, notification.CustomerId, notification.OrderId);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            // Idempotency: this OrderId was already accrued. No-op.
            _logger.LogWarning(
                "VoucherAccrualHandler: duplicate event for order {OrderId} — already accrued. Skipping.",
                notification.OrderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "VoucherAccrualHandler: unexpected error processing order {OrderId}", notification.OrderId);
            throw;
        }
    }

    /// <summary>
    /// Detects SQL Server unique constraint violations (error 2627 / 2601).
    /// </summary>
    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        return ex.InnerException?.Message.Contains("UQ_CustomerVoucherTransactions_OrderId",
            StringComparison.OrdinalIgnoreCase) == true
            || ex.InnerException?.Message.Contains("Cannot insert duplicate key",
            StringComparison.OrdinalIgnoreCase) == true;
    }
}
