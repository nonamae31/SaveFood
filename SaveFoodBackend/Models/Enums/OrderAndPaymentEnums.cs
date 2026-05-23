using System;

namespace SaveFoodBackend.Models.Enums;

public enum OrderStatusEnum : byte
{
    Pending = 0,
    Confirmed = 1,
    ReadyForPickup = 2,
    Completed = 3,
    Cancelled = 4
}

public enum PaymentMethodEnum : byte
{
    Cash = 0,
    VNPay = 1,
    MoMo = 2
}

public enum PaymentStatusEnum : byte
{
    Pending = 0,
    Paid = 1,
    Failed = 2,
    Refunded = 3
}

[Flags]
public enum ReviewFlagsEnum : byte
{
    None = 0,
    IsHidden = 1,
    IsDeleted = 2
}
