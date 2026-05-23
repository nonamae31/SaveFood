using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class Review
{
    [NotMapped]
    public bool IsHidden
    {
        get => (ReviewFlags & (byte)ReviewFlagsEnum.IsHidden) == (byte)ReviewFlagsEnum.IsHidden;
        set => ReviewFlags = (byte)(value ? (ReviewFlags | (byte)ReviewFlagsEnum.IsHidden) : (ReviewFlags & ~(byte)ReviewFlagsEnum.IsHidden));
    }

    [NotMapped]
    public bool IsDeleted
    {
        get => (ReviewFlags & (byte)ReviewFlagsEnum.IsDeleted) == (byte)ReviewFlagsEnum.IsDeleted;
        set => ReviewFlags = (byte)(value ? (ReviewFlags | (byte)ReviewFlagsEnum.IsDeleted) : (ReviewFlags & ~(byte)ReviewFlagsEnum.IsDeleted));
    }
}
