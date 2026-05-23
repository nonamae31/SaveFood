using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class ProductImage
{
    [NotMapped]
    public bool IsPrimary
    {
        get => (ImageFlags & (byte)ImageFlagsEnum.IsPrimary) == (byte)ImageFlagsEnum.IsPrimary;
        set => ImageFlags = (byte)(value ? (ImageFlags | (byte)ImageFlagsEnum.IsPrimary) : (ImageFlags & ~(byte)ImageFlagsEnum.IsPrimary));
    }

    [NotMapped]
    public bool IsDeleted
    {
        get => (ImageFlags & (byte)ImageFlagsEnum.IsDeleted) == (byte)ImageFlagsEnum.IsDeleted;
        set => ImageFlags = (byte)(value ? (ImageFlags | (byte)ImageFlagsEnum.IsDeleted) : (ImageFlags & ~(byte)ImageFlagsEnum.IsDeleted));
    }
}
