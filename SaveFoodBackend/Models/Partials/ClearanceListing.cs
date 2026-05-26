using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class ClearanceListing
{
    [NotMapped]
    public ListingStatus ListingStatusEnum
    {
        get => (ListingStatus)Status;
        set => Status = (byte)value;
    }

    [NotMapped]
    public bool IsDeleted
    {
        get => (ListingFlags & (byte)ListingFlagsEnum.IsDeleted) == (byte)ListingFlagsEnum.IsDeleted;
        set => ListingFlags = (byte)(value ? (ListingFlags | (byte)ListingFlagsEnum.IsDeleted) : (ListingFlags & ~(byte)ListingFlagsEnum.IsDeleted));
    }

    [NotMapped]
    public bool IsAutoRenew
    {
        get => (ListingFlags & (byte)ListingFlagsEnum.IsAutoRenew) == (byte)ListingFlagsEnum.IsAutoRenew;
        set => ListingFlags = (byte)(value ? (ListingFlags | (byte)ListingFlagsEnum.IsAutoRenew) : (ListingFlags & ~(byte)ListingFlagsEnum.IsAutoRenew));
    }


}
