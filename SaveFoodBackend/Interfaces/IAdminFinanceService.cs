using System;
using System.Threading.Tasks;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Admin;

namespace SaveFoodBackend.Interfaces;

public interface IAdminFinanceService
{
    Task<PaginatedList<WalletTransactionDTO>> GetTransactionsAsync(int pageNumber, int pageSize, string? search = null, DateTime? startDate = null, DateTime? endDate = null);
    Task<PaginatedList<WithdrawalRequestDTO>> GetWithdrawalsAsync(int pageNumber, int pageSize, byte? status, string? search = null, DateTime? startDate = null, DateTime? endDate = null);
    Task<PaginatedList<CustomerWalletTransactionAdminDTO>> GetCustomerWalletTransactionsAsync(int pageNumber, int pageSize, string? search = null, DateTime? startDate = null, DateTime? endDate = null);
}
