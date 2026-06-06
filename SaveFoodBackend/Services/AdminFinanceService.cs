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

        withdrawal.AdminNote = request.AdminNote;
        withdrawal.ProcessedAt = DateTime.UtcNow;

        if (withdrawal.StoreId.HasValue)
        {
            var wallet = withdrawal.Store?.StoreWallet;
            if (wallet == null) throw new InvalidOperationException("Store wallet not found.");

            var pendingTx = await _financeRepo.GetPendingWalletTransactionByReferenceIdAsync(withdrawal.Id);
            if (pendingTx == null) throw new InvalidOperationException("Pending store wallet transaction not found.");

            if (request.IsApproved)
            {
                withdrawal.Status = (byte)WithdrawalStatusEnum.Paid;
                pendingTx.Status = (byte)TransactionStatusEnum.Completed;
                pendingTx.Description = "Withdrawal Processed";
            }
            else
            {
                withdrawal.Status = (byte)WithdrawalStatusEnum.Rejected;
                wallet.AvailableBalance += withdrawal.Amount;
                pendingTx.Status = (byte)TransactionStatusEnum.Failed;
                pendingTx.Description = "Withdrawal Rejected";
            }
        }
        else if (withdrawal.UserId.HasValue)
        {
            var customerWallet = withdrawal.User?.CustomerWallet;
            if (customerWallet == null) throw new InvalidOperationException("Customer wallet not found.");

            var pendingTx = await _financeRepo.GetPendingCustomerWalletTransactionByReferenceIdAsync(withdrawal.Id);
            if (pendingTx == null) throw new InvalidOperationException("Pending customer wallet transaction not found.");

            if (request.IsApproved)
            {
                withdrawal.Status = (byte)WithdrawalStatusEnum.Paid;
                pendingTx.Status = 1; // Completed
                pendingTx.Description = "Rút tiền thành công";
            }
            else
            {
                withdrawal.Status = (byte)WithdrawalStatusEnum.Rejected;
                customerWallet.Balance += withdrawal.Amount;
                pendingTx.Status = 2; // Failed
                pendingTx.Description = "Rút tiền bị từ chối: " + request.AdminNote;
            }
        }
        else
        {
            throw new InvalidOperationException("Invalid withdrawal request type.");
        }

        await _financeRepo.SaveChangesAsync();
        return request.IsApproved ? "Withdrawal paid successfully." : "Withdrawal rejected.";
    }


}
