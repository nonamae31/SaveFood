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

    IQueryable<WalletTransaction> GetPlatformFeeTransactionsQuery();
    Task<IEnumerable<WalletTransaction>> GetPlatformFeeTransactionsAsync(CancellationToken ct = default);
    void AddWalletTransaction(WalletTransaction transaction);
    void AddCustomerWalletTransaction(CustomerWalletTransaction transaction);
    
    Task<StoreWallet?> GetStoreWalletByStoreIdAsync(Guid storeId, CancellationToken ct = default);
    Task<(IEnumerable<WalletTransaction> Items, int TotalCount)> GetStoreTransactionsAsync(Guid storeWalletId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<(IEnumerable<WithdrawalRequest> Items, int TotalCount)> GetStoreWithdrawalsAsync(Guid storeId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<WalletTransaction?> GetPendingWalletTransactionByReferenceIdAsync(Guid referenceId, CancellationToken ct = default);
    Task<CustomerWalletTransaction?> GetPendingCustomerWalletTransactionByReferenceIdAsync(Guid referenceId, CancellationToken ct = default);
    void AddWithdrawalRequest(WithdrawalRequest request);
    void AddStoreWallet(StoreWallet storeWallet);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
