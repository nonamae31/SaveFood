using System;

namespace SaveFoodBackend.Models.Enums;

[Flags]
public enum PlanFlagsEnum : byte
{
    None = 0,
    IsActive = 1,
    IsDeleted = 2
}

public enum SubscriptionStatus : byte
{
    Active = 0,
    Expired = 1,
    Cancelled = 2,
    Pending = 3
}
