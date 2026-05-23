using System;

namespace SaveFoodBackend.Models.Enums;

[Flags]
public enum ProductFlagsEnum : byte
{
    None = 0,
    IsDeleted = 1,
    IsHidden = 2
}

[Flags]
public enum ImageFlagsEnum : byte
{
    None = 0,
    IsPrimary = 1,
    IsDeleted = 2
}

public enum ListingStatus : byte
{
    Draft = 0,
    Published = 1,
    SoldOut = 2,
    Expired = 3
}

[Flags]
public enum ListingFlagsEnum : byte
{
    None = 0,
    IsDeleted = 1,
    IsAutoRenew = 2
}

public enum TriggerType : byte
{
    TimeBeforeExpiry = 0,
    StockRemaining = 1
}

[Flags]
public enum RuleFlagsEnum : byte
{
    None = 0,
    IsActive = 1,
    IsDeleted = 2
}
