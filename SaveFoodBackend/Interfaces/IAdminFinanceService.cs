using System;
using System.Threading.Tasks;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Admin;

namespace SaveFoodBackend.Interfaces;

public interface IAdminFinanceService
{
    Task<PaginatedList<WalletTransactionDTO>> GetTransactionsAsync(int pageNumber, int pageSize);
    Task<PaginatedList<WithdrawalRequestDTO>> GetWithdrawalsAsync(int pageNumber, int pageSize, byte? status);
    Task<string> ProcessWithdrawalAsync(Guid id, ProcessFinanceRequestDTO request);
}
