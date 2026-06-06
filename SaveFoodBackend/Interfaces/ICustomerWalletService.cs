using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Customer.Wallets;

namespace SaveFoodBackend.Interfaces;

public interface ICustomerWalletService
{
    Task<CustomerWalletDTO> GetMyWalletAsync(Guid userId, CancellationToken ct = default);
    Task<List<CustomerWalletTransactionDTO>> GetMyTransactionsAsync(Guid userId, CancellationToken ct = default);
    Task RequestWithdrawalAsync(Guid userId, CustomerWithdrawRequest request, CancellationToken ct = default);
}
