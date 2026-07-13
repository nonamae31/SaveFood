namespace SaveFoodBackend.Models.Enums
{
    public enum ComplaintStatus
    {
        Pending = 0,
        Processing = 1,
        Resolved = 2,
        Rejected = 3
    }

    public enum ComplaintType
    {
        ProductQuality = 1,
        ServiceAttitude = 2,
        LateDelivery = 3,
        WrongItem = 4,
        Other = 99
    }
}
