using System;
using System.Threading.Tasks;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services;

public class AdminFinanceService : IAdminFinanceService
{
    private readonly IFinanceRepository _financeRepo;

    public AdminFinanceService(IFinanceRepository financeRepo)
    {
        _financeRepo = financeRepo;
    }

    public async Task<PaginatedList<WalletTransactionDTO>> GetTransactionsAsync(int pageNumber, int pageSize)
    {
        var (items, totalCount) = await _financeRepo.GetTransactionsAsync(pageNumber, pageSize);
        return new PaginatedList<WalletTransactionDTO>(items.ToList(), totalCount, pageNumber, pageSize);
    }

    public async Task<PaginatedList<WithdrawalRequestDTO>> GetWithdrawalsAsync(int pageNumber, int pageSize, byte? status)
    {
        var (items, totalCount) = await _financeRepo.GetWithdrawalsAsync(pageNumber, pageSize, status);
        return new PaginatedList<WithdrawalRequestDTO>(items.ToList(), totalCount, pageNumber, pageSize);
    }

    public async Task<string> ProcessWithdrawalAsync(Guid id, ProcessFinanceRequestDTO request)
    {
        var withdrawal = await _financeRepo.GetWithdrawalWithStoreWalletAsync(id);

        if (withdrawal == null) throw new InvalidOperationException("Withdrawal request not found.");
        if (withdrawal.Status != (byte)WithdrawalStatusEnum.Pending && withdrawal.Status != (byte)WithdrawalStatusEnum.Processing)
            throw new InvalidOperationException("Withdrawal request has already been processed.");

        var wallet = withdrawal.Store.StoreWallet;
        if (wallet == null) throw new InvalidOperationException("Store wallet not found.");

        withdrawal.AdminNote = request.AdminNote;
        withdrawal.ProcessedAt = DateTime.UtcNow;

        if (request.IsApproved)
        {
            withdrawal.Status = (byte)WithdrawalStatusEnum.Paid;
            // The money was already deducted from AvailableBalance when request was created.
            // Create a completed WalletTransaction
            _financeRepo.AddWalletTransaction(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = wallet.Id,
                Amount = -withdrawal.Amount,
                Type = (byte)TransactionTypeEnum.Withdrawal,
                Status = (byte)TransactionStatusEnum.Completed,
                ReferenceId = withdrawal.Id,
                Description = "Withdrawal Processed",
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            withdrawal.Status = (byte)WithdrawalStatusEnum.Rejected;
            // Refund the money back to AvailableBalance
            wallet.AvailableBalance += withdrawal.Amount;

            _financeRepo.AddWalletTransaction(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = wallet.Id,
                Amount = withdrawal.Amount,
                Type = (byte)TransactionTypeEnum.Withdrawal,
                Status = (byte)TransactionStatusEnum.Failed,
                ReferenceId = withdrawal.Id,
                Description = "Withdrawal Rejected",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _financeRepo.SaveChangesAsync();
        return request.IsApproved ? "Withdrawal paid successfully." : "Withdrawal rejected.";
    }

    public async Task<PaginatedList<RefundRequestDTO>> GetRefundsAsync(int pageNumber, int pageSize, byte? status)
    {
        var (items, totalCount) = await _financeRepo.GetRefundsAsync(pageNumber, pageSize, status);
        return new PaginatedList<RefundRequestDTO>(items.ToList(), totalCount, pageNumber, pageSize);
    }

    public async Task<string> ProcessRefundAsync(Guid id, ProcessFinanceRequestDTO request)
    {
        var refund = await _financeRepo.GetRefundWithOrderAndWalletAsync(id);

        if (refund == null) throw new InvalidOperationException("Refund request not found.");
        if (refund.Status != (byte)RefundStatusEnum.Pending && refund.Status != 1)
            throw new InvalidOperationException("Refund request has already been processed.");

        var wallet = refund.Order.Store.StoreWallet;
        if (wallet == null) throw new InvalidOperationException("Store wallet not found.");

        refund.AdminNote = request.AdminNote;
        refund.ProcessedAt = DateTime.UtcNow;

        if (request.IsApproved)
        {
            if (wallet.PendingBalance < refund.Amount)
                throw new InvalidOperationException("Insufficient Pending Balance to process refund.");

            refund.Status = (byte)RefundStatusEnum.Refunded;
            wallet.PendingBalance -= refund.Amount;

            _financeRepo.AddWalletTransaction(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = wallet.Id,
                Amount = -refund.Amount,
                Type = (byte)TransactionTypeEnum.Refund,
                Status = (byte)TransactionStatusEnum.Completed,
                OrderId = refund.OrderId,
                ReferenceId = refund.Id,
                Description = "Refund to Customer",
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            refund.Status = (byte)RefundStatusEnum.Rejected;
            // No wallet changes needed if rejected (pending balance stays pending until order completes)
        }

        await _financeRepo.SaveChangesAsync();
        return request.IsApproved ? "Refund completed successfully." : "Refund rejected.";
    }
}
