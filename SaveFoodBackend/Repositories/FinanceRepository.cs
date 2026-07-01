using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Repositories;

public class FinanceRepository : IFinanceRepository
{
    private readonly SaveFoodDbContext _ctx;

    public FinanceRepository(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<(IEnumerable<WalletTransactionDTO> Items, int TotalCount)> GetTransactionsAsync(int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var query = _ctx.WalletTransactions
            .Include(t => t.StoreWallet)
            .ThenInclude(w => w.Store)
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var dtos = items.Select(t => new WalletTransactionDTO
        {
            Id = t.Id,
            StoreWalletId = t.StoreWalletId,
            StoreName = t.StoreWallet.Store.Name,
            Amount = t.Amount,
            Type = t.Type,
            Status = t.Status,
            OrderId = t.OrderId,
            Description = t.Description,
            CreatedAt = t.CreatedAt
        }).ToList();

        return (dtos, totalCount);
    }

    public async Task<(IEnumerable<WithdrawalRequestDTO> Items, int TotalCount)> GetWithdrawalsAsync(int pageNumber, int pageSize, byte? status = null, CancellationToken ct = default)
    {
        var query = _ctx.WithdrawalRequests
            .Include(w => w.Store)
            .Include(w => w.User)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(w => w.Status == status.Value);
        }

        query = query.OrderByDescending(w => w.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var dtos = items.Select(w => new WithdrawalRequestDTO
        {
            Id = w.Id,
            RequesterId = w.StoreId ?? w.UserId ?? Guid.Empty,
            RequesterName = w.Store != null ? w.Store.Name : (w.User != null ? w.User.FullName : "Unknown"),
            RequesterType = w.StoreId.HasValue ? "Store" : "Customer",
            Amount = w.Amount,
            Status = w.Status,
            BankName = w.BankName,
            BankAccountNumber = w.BankAccountNumber,
            BankAccountName = w.BankAccountName,
            AdminNote = w.AdminNote,
            CreatedAt = w.CreatedAt,
            ProcessedAt = w.ProcessedAt
        }).ToList();

        return (dtos, totalCount);
    }

    public async Task<WithdrawalRequest?> GetWithdrawalWithStoreWalletAsync(Guid id, CancellationToken ct = default)
    {
        return await _ctx.WithdrawalRequests
            .Include(w => w.Store)
                .ThenInclude(s => s.StoreWallet)
            .Include(w => w.User)
                .ThenInclude(u => u.CustomerWallet)
            .FirstOrDefaultAsync(w => w.Id == id, ct);
    }


    public IQueryable<WalletTransaction> GetPlatformFeeTransactionsQuery()
    {
        return _ctx.WalletTransactions
            .Where(t => t.Type == (byte)TransactionTypeEnum.PlatformFee && t.Status == (byte)TransactionStatusEnum.Completed);
    }

    public async Task<IEnumerable<WalletTransaction>> GetPlatformFeeTransactionsAsync(CancellationToken ct = default)
    {
        return await _ctx.WalletTransactions
            .Where(t => t.Type == (byte)TransactionTypeEnum.PlatformFee && t.Status == (byte)TransactionStatusEnum.Completed)
            .ToListAsync(ct);
    }

    public async Task<decimal> GetTotalPlatformFeeRevenueAsync(CancellationToken ct = default)
    {
        return await _ctx.WalletTransactions
            .Where(t => t.Type == (byte)TransactionTypeEnum.PlatformFee && t.Status == (byte)TransactionStatusEnum.Completed)
            .SumAsync(t => t.Amount, ct);
    }

    public async Task<List<MonthlyRevenue>> GetMonthlyPlatformFeeRevenuesAsync(CancellationToken ct = default)
    {
        return await _ctx.WalletTransactions
            .Where(t => t.Type == (byte)TransactionTypeEnum.PlatformFee && t.Status == (byte)TransactionStatusEnum.Completed)
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
            .Select(g => new MonthlyRevenue
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Revenue = g.Sum(t => t.Amount)
            })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync(ct);
    }

    public void AddWalletTransaction(WalletTransaction transaction)
    {
        _ctx.WalletTransactions.Add(transaction);
    }

    public void AddCustomerWalletTransaction(CustomerWalletTransaction transaction)
    {
        _ctx.CustomerWalletTransactions.Add(transaction);
    }

    public async Task<StoreWallet?> GetStoreWalletByStoreIdAsync(Guid storeId, CancellationToken ct = default)
    {
        return await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == storeId, ct);
    }

    public async Task<(IEnumerable<WalletTransaction> Items, int TotalCount)> GetStoreTransactionsAsync(Guid storeWalletId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var query = _ctx.WalletTransactions
            .Where(t => t.StoreWalletId == storeWalletId)
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<(IEnumerable<WithdrawalRequest> Items, int TotalCount)> GetStoreWithdrawalsAsync(Guid storeId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var query = _ctx.WithdrawalRequests
            .Where(w => w.StoreId == storeId)
            .OrderByDescending(w => w.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<WalletTransaction?> GetPendingWalletTransactionByReferenceIdAsync(Guid referenceId, CancellationToken ct = default)
    {
        return await _ctx.WalletTransactions
            .FirstOrDefaultAsync(t => t.ReferenceId == referenceId && t.Status == (byte)TransactionStatusEnum.Pending, ct);
    }

    public async Task<CustomerWalletTransaction?> GetPendingCustomerWalletTransactionByReferenceIdAsync(Guid referenceId, CancellationToken ct = default)
    {
        return await _ctx.CustomerWalletTransactions
            .FirstOrDefaultAsync(t => t.ReferenceId == referenceId && t.Status == 0, ct); // 0 = Pending
    }

    public void AddWithdrawalRequest(WithdrawalRequest request)
    {
        _ctx.WithdrawalRequests.Add(request);
    }

    public void AddStoreWallet(StoreWallet storeWallet)
    {
        _ctx.StoreWallets.Add(storeWallet);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }
}
