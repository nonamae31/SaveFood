using System;

namespace SaveFoodBackend.Models.Enums;

public enum StoreStatus : byte
{
    Active = 0,
    Suspended = 1,
    Closed = 2
}

[Flags]
public enum StoreFlagsEnum : byte
{
    None = 0,
    IsDeleted = 1,
    IsVerified = 2
}

public enum StaffRole : byte
{
    Owner = 0,
    Manager = 1,
    Staff = 2
}

[Flags]
public enum StaffFlagsEnum : byte
{
    None = 0,
    IsActive = 1,
    IsDeleted = 2
}
