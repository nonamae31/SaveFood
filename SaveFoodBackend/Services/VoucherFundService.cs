using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Vouchers;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services;

public class VoucherFundService : IVoucherFundService
{
    private readonly SaveFoodDbContext _ctx;
    private const int RecentTransactionCount = 20;

    public VoucherFundService(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<VoucherFundDTO> GetMyVoucherFundAsync(Guid userId, CancellationToken ct = default)
    {
        var fund = await _ctx.CustomerVoucherFunds
            .FirstOrDefaultAsync(f => f.CustomerId == userId, ct);

        if (fund == null)
        {
            // Customer has not yet completed any qualifying order — return empty state.
            return new VoucherFundDTO(
                AccumulatedBalance: 0,
                AvailableBalance: 0,
                TotalEarned: 0,
                TotalTransactions: 0,
                RecentTransactions: new List<VoucherTransactionDTO>()
            );
        }

        var totalCount = await _ctx.CustomerVoucherTransactions
            .CountAsync(t => t.CustomerVoucherFundId == fund.Id, ct);

        var recentTxEntities = await _ctx.CustomerVoucherTransactions
            .Where(t => t.CustomerVoucherFundId == fund.Id)
            .OrderByDescending(t => t.CreatedAt)
            .Take(RecentTransactionCount)
            .Select(t => new { t.Id, t.OrderId, OrderCode = t.Order.OrderCode, t.Amount, t.OrderTotal, t.CreatedAt })
            .ToListAsync(ct);

        var recentTransactions = recentTxEntities
            .Select(t => new VoucherTransactionDTO(
                t.Id,
                t.OrderId,
                t.OrderCode?.ToString(),
                t.Amount,
                t.OrderTotal,
                t.CreatedAt))
            .ToList();

        return new VoucherFundDTO(
            AccumulatedBalance: fund.AccumulatedBalance,
            AvailableBalance: fund.AccumulatedBalance - fund.ReservedAmount,
            TotalEarned: fund.TotalEarned,
            TotalTransactions: totalCount,
            RecentTransactions: recentTransactions
        );
    }
}
