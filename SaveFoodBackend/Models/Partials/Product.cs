using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class Product
{
    [NotMapped]
    public bool IsDeleted
    {
        get => (ProductFlags & (byte)ProductFlagsEnum.IsDeleted) == (byte)ProductFlagsEnum.IsDeleted;
        set => ProductFlags = (byte)(value ? (ProductFlags | (byte)ProductFlagsEnum.IsDeleted) : (ProductFlags & ~(byte)ProductFlagsEnum.IsDeleted));
    }

    [NotMapped]
    public bool IsHidden
    {
        get => (ProductFlags & (byte)ProductFlagsEnum.IsHidden) == (byte)ProductFlagsEnum.IsHidden;
        set => ProductFlags = (byte)(value ? (ProductFlags | (byte)ProductFlagsEnum.IsHidden) : (ProductFlags & ~(byte)ProductFlagsEnum.IsHidden));
    }

    [NotMapped]
    public bool IsSurpriseBag
    {
        get => (ProductFlags & (byte)ProductFlagsEnum.IsSurpriseBag) == (byte)ProductFlagsEnum.IsSurpriseBag;
        set => ProductFlags = (byte)(value ? (ProductFlags | (byte)ProductFlagsEnum.IsSurpriseBag) : (ProductFlags & ~(byte)ProductFlagsEnum.IsSurpriseBag));
    }
}
