using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Wallets;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Services;

public class CustomerWalletService : ICustomerWalletService
{
    private readonly SaveFoodDbContext _ctx;

    public CustomerWalletService(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<CustomerWalletDTO> GetMyWalletAsync(Guid userId, CancellationToken ct = default)
    {
        var wallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);

        if (wallet == null)
        {
            // Auto create wallet if it doesn't exist
            wallet = new CustomerWallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _ctx.CustomerWallets.Add(wallet);
            await _ctx.SaveChangesAsync(ct);
        }

        return new CustomerWalletDTO
        {
            Id = wallet.Id,
            Balance = wallet.Balance,
            UpdatedAt = wallet.UpdatedAt
        };
    }

    public async Task<List<CustomerWalletTransactionDTO>> GetMyTransactionsAsync(Guid userId, CancellationToken ct = default)
    {
        var wallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);

        if (wallet == null)
        {
            return new List<CustomerWalletTransactionDTO>();
        }

        var transactions = await _ctx.CustomerWalletTransactions
            .Include(t => t.Order)
            .Where(t => t.CustomerWalletId == wallet.Id)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return transactions.Select(t => new CustomerWalletTransactionDTO
        {
            Id = t.Id,
            Amount = t.Amount,
            Type = t.Type,
            Status = t.Status,
            Description = t.Description,
            CreatedAt = t.CreatedAt,
            OrderId = t.OrderId,
            OrderCode = t.Order?.OrderCode
        }).ToList();
    }

    public async Task RequestWithdrawalAsync(Guid userId, CustomerWithdrawRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            throw new InvalidOperationException("Số tiền rút phải lớn hơn 0đ.");
        }

        var wallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);
        if (wallet == null)
        {
            throw new InvalidOperationException("Ví cá nhân không tồn tại.");
        }

        if (wallet.Balance < request.Amount)
        {
            throw new InvalidOperationException("Số dư không đủ để thực hiện giao dịch.");
        }

        // Deduct balance
        wallet.Balance -= request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var withdrawalRequest = new WithdrawalRequest
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Amount = request.Amount,
            Status = 0, // Pending
            BankName = request.BankName,
            BankAccountNumber = request.AccountNumber,
            BankAccountName = request.AccountName,
            CreatedAt = DateTime.UtcNow
        };

        // Create pending transaction
        var tx = new CustomerWalletTransaction
        {
            Id = Guid.NewGuid(),
            CustomerWalletId = wallet.Id,
            Amount = request.Amount,
            Type = 1, // Withdrawal
            Status = 0, // Pending
            ReferenceId = withdrawalRequest.Id,
            CreatedAt = DateTime.UtcNow,
            Description = $"Rút tiền về {request.BankName} - STK: {request.AccountNumber} - Chủ thẻ: {request.AccountName}"
        };

        _ctx.WithdrawalRequests.Add(withdrawalRequest);
        _ctx.CustomerWalletTransactions.Add(tx);
        await _ctx.SaveChangesAsync(ct);
    }
}
