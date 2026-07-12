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

    /// <summary>
    /// Tạo PayOS payment link để nạp tiền vào ví. Trả về checkoutUrl.
    /// Idempotency-Key header chống double-submit.
    /// </summary>
    Task<string> CreateTopUpPaymentAsync(Guid userId, decimal amount, string idempotencyKey, CancellationToken ct = default);

    /// <summary>
    /// Tạo yêu cầu rút tiền. Idempotency-Key header chống double-submit.
    /// </summary>
    Task RequestWithdrawalAsync(Guid userId, CustomerWithdrawRequest request, string idempotencyKey, CancellationToken ct = default);
}

