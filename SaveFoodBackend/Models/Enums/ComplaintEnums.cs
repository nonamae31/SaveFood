using System;

namespace SaveFoodBackend.Models.Enums
{
    public enum ComplaintStatusEnum : byte
    {
        Pending = 0,
        Processing = 1,
        Resolved = 2,
        Rejected = 3,
        Cancelled = 4
    }

    public enum ComplaintTypeEnum : byte
    {
        ProductQuality = 1,
        MissingItem = 2,
        WrongItem = 3,
        StoreAttitude = 4,
        Other = 5
    }
}
