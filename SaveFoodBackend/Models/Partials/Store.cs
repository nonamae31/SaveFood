using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class Store
{
    [NotMapped]
    public StoreStatus StoreStatusEnum
    {
        get => (StoreStatus)Status;
        set => Status = (byte)value;
    }

    [NotMapped]
    public bool IsDeleted
    {
        get => (StoreFlags & (byte)StoreFlagsEnum.IsDeleted) == (byte)StoreFlagsEnum.IsDeleted;
        set => StoreFlags = (byte)(value ? (StoreFlags | (byte)StoreFlagsEnum.IsDeleted) : (StoreFlags & ~(byte)StoreFlagsEnum.IsDeleted));
    }

    [NotMapped]
    public bool IsVerified
    {
        get => (StoreFlags & (byte)StoreFlagsEnum.IsVerified) == (byte)StoreFlagsEnum.IsVerified;
        set => StoreFlags = (byte)(value ? (StoreFlags | (byte)StoreFlagsEnum.IsVerified) : (StoreFlags & ~(byte)StoreFlagsEnum.IsVerified));
    }
}
