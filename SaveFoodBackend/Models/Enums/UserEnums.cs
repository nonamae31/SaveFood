using System;

namespace SaveFoodBackend.Models.Enums;

public enum UserStatus : byte
{
    Active = 0,
    Inactive = 1,
    Banned = 2
}

[Flags]
public enum UserFlagsEnum : byte
{
    None = 0,
    IsMale = 1,
    IsDeleted = 2,
    EmailVerified = 4
}
