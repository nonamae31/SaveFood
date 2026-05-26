using System;

namespace SaveFoodBackend.Models.Enums;

public enum TransactionTypeEnum : byte
{
    OrderRevenue = 1,
    PlatformFee = 2,
    Withdrawal = 3,
    Refund = 4,
    Penalty = 5
}

public enum TransactionStatusEnum : byte
{
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Cancelled = 3
}

public enum WithdrawalStatusEnum : byte
{
    Pending = 0,
    Processing = 1,
    Paid = 2,
    Rejected = 3
}

public enum RefundStatusEnum : byte
{
    Pending = 0,
    Rejected = 2,
    Refunded = 3
}
