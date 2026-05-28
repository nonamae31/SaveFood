using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface IFinanceRepository
{
    Task<(IEnumerable<WalletTransactionDTO> Items, int TotalCount)> GetTransactionsAsync(int pageNumber, int pageSize, CancellationToken ct = default);
    Task<(IEnumerable<WithdrawalRequestDTO> Items, int TotalCount)> GetWithdrawalsAsync(int pageNumber, int pageSize, byte? status = null, CancellationToken ct = default);
    Task<WithdrawalRequest?> GetWithdrawalWithStoreWalletAsync(Guid id, CancellationToken ct = default);
    Task<(IEnumerable<RefundRequestDTO> Items, int TotalCount)> GetRefundsAsync(int pageNumber, int pageSize, byte? status = null, CancellationToken ct = default);
    Task<RefundRequest?> GetRefundWithOrderAndWalletAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<WalletTransaction>> GetPlatformFeeTransactionsAsync(CancellationToken ct = default);
    void AddWalletTransaction(WalletTransaction transaction);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
