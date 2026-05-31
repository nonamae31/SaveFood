using System;
using System.Threading.Tasks;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Store;

namespace SaveFoodBackend.Interfaces;

public interface IStoreFinanceService
{
    Task<StoreWalletDTO?> GetStoreWalletAsync(Guid storeId);
    Task<PaginatedList<WalletTransactionListDTO>> GetTransactionsAsync(Guid storeId, int pageNumber, int pageSize);
    Task<PaginatedList<WithdrawalRequestListDTO>> GetWithdrawalsAsync(Guid storeId, int pageNumber, int pageSize);
    Task<string> CreateWithdrawalRequestAsync(Guid storeId, CreateWithdrawalRequestDTO dto);
}
