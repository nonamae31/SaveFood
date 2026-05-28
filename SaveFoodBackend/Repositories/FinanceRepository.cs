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
            StoreId = w.StoreId,
            StoreName = w.Store.Name,
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
            .FirstOrDefaultAsync(w => w.Id == id, ct);
    }

    public async Task<(IEnumerable<RefundRequestDTO> Items, int TotalCount)> GetRefundsAsync(int pageNumber, int pageSize, byte? status = null, CancellationToken ct = default)
    {
        var query = _ctx.RefundRequests
            .Include(r => r.RequestedByNavigation)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        query = query.OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var dtos = items.Select(r => new RefundRequestDTO
        {
            Id = r.Id,
            OrderId = r.OrderId,
            RequestedBy = r.RequestedBy,
            CustomerName = r.RequestedByNavigation.FullName,
            Amount = r.Amount,
            Reason = r.Reason,
            Status = r.Status == 1 ? (byte)0 : r.Status,
            AdminNote = r.AdminNote,
            CustomerBankName = r.CustomerBankName,
            CustomerBankAccount = r.CustomerBankAccount,
            CustomerBankAccountName = r.CustomerBankAccountName,
            CreatedAt = r.CreatedAt,
            ProcessedAt = r.ProcessedAt
        }).ToList();

        return (dtos, totalCount);
    }

    public async Task<RefundRequest?> GetRefundWithOrderAndWalletAsync(Guid id, CancellationToken ct = default)
    {
        return await _ctx.RefundRequests
            .Include(r => r.Order)
            .ThenInclude(o => o.Store)
            .ThenInclude(s => s.StoreWallet)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
    }

    public async Task<IEnumerable<WalletTransaction>> GetPlatformFeeTransactionsAsync(CancellationToken ct = default)
    {
        return await _ctx.WalletTransactions
            .Where(t => t.Type == (byte)TransactionTypeEnum.PlatformFee && t.Status == (byte)TransactionStatusEnum.Completed)
            .ToListAsync(ct);
    }

    public void AddWalletTransaction(WalletTransaction transaction)
    {
        _ctx.WalletTransactions.Add(transaction);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }
}
