using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Customer.Vouchers;

public record VoucherTransactionDTO(
    Guid Id,
    Guid OrderId,
    string? OrderCode,
    decimal Amount,
    decimal OrderTotal,
    DateTime CreatedAt
);

public record VoucherFundDTO(
    decimal AccumulatedBalance,
    decimal AvailableBalance,
    decimal TotalEarned,
    int TotalTransactions,
    List<VoucherTransactionDTO> RecentTransactions
);
