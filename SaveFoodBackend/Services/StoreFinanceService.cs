using System;
using System.Linq;
using System.Threading.Tasks;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services;

public class StoreFinanceService : IStoreFinanceService
{
    private readonly IFinanceRepository _financeRepo;

    public StoreFinanceService(IFinanceRepository financeRepo)
    {
        _financeRepo = financeRepo;
    }

    public async Task<StoreWalletDTO?> GetStoreWalletAsync(Guid storeId)
    {
        var wallet = await _financeRepo.GetStoreWalletByStoreIdAsync(storeId);
        if (wallet == null) return null;

        return new StoreWalletDTO
        {
            Id = wallet.Id,
            AvailableBalance = wallet.AvailableBalance,
            PendingBalance = wallet.PendingBalance,
            UpdatedAt = wallet.UpdatedAt
        };
    }

    public async Task<PaginatedList<WalletTransactionListDTO>> GetTransactionsAsync(Guid storeId, int pageNumber, int pageSize)
    {
        var wallet = await _financeRepo.GetStoreWalletByStoreIdAsync(storeId);
        if (wallet == null) throw new InvalidOperationException("Store wallet not found.");

        var (items, totalCount) = await _financeRepo.GetStoreTransactionsAsync(wallet.Id, pageNumber, pageSize);

        var dtos = items.Select(t => new WalletTransactionListDTO
        {
            Id = t.Id,
            Amount = t.Amount,
            Type = (TransactionTypeEnum)t.Type,
            Status = (TransactionStatusEnum)t.Status,
            OrderId = t.OrderId,
            Description = t.Description,
            CreatedAt = t.CreatedAt
        }).ToList();

        return new PaginatedList<WalletTransactionListDTO>(dtos, totalCount, pageNumber, pageSize);
    }

    public async Task<PaginatedList<WithdrawalRequestListDTO>> GetWithdrawalsAsync(Guid storeId, int pageNumber, int pageSize)
    {
        var (items, totalCount) = await _financeRepo.GetStoreWithdrawalsAsync(storeId, pageNumber, pageSize);

        var dtos = items.Select(w => new WithdrawalRequestListDTO
        {
            Id = w.Id,
            Amount = w.Amount,
            Status = (WithdrawalStatusEnum)w.Status,
            BankName = w.BankName,
            BankAccountNumber = w.BankAccountNumber,
            BankAccountName = w.BankAccountName,
            AdminNote = w.AdminNote,
            CreatedAt = w.CreatedAt,
            ProcessedAt = w.ProcessedAt
        }).ToList();

        return new PaginatedList<WithdrawalRequestListDTO>(dtos, totalCount, pageNumber, pageSize);
    }

    public async Task<string> CreateWithdrawalRequestAsync(Guid storeId, CreateWithdrawalRequestDTO dto)
    {
        var wallet = await _financeRepo.GetStoreWalletByStoreIdAsync(storeId);
        if (wallet == null) throw new InvalidOperationException("Store wallet not found.");

        if (dto.Amount < 50000)
            throw new InvalidOperationException("Minimum withdrawal amount is 50,000 VND.");

        if (dto.Amount > wallet.AvailableBalance)
            throw new InvalidOperationException("Insufficient available balance.");

        // Deduct balance
        wallet.AvailableBalance -= dto.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        // Create Withdrawal Request
        var withdrawal = new WithdrawalRequest
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            Amount = dto.Amount,
            Status = (byte)WithdrawalStatusEnum.Pending,
            BankName = dto.BankName,
            BankAccountNumber = dto.BankAccountNumber,
            BankAccountName = dto.BankAccountName,
            CreatedAt = DateTime.UtcNow
        };
        _financeRepo.AddWithdrawalRequest(withdrawal);

        // Create Pending Transaction
        var transaction = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            StoreWalletId = wallet.Id,
            Amount = -dto.Amount,
            Type = (byte)TransactionTypeEnum.Withdrawal,
            Status = (byte)TransactionStatusEnum.Pending,
            ReferenceId = withdrawal.Id,
            Description = "Pending Withdrawal Request",
            CreatedAt = DateTime.UtcNow
        };
        _financeRepo.AddWalletTransaction(transaction);

        await _financeRepo.SaveChangesAsync();
        return "Withdrawal request created successfully.";
    }
}
