using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class StoreStaff
{
    [NotMapped]
    public StaffRole StaffRoleEnum
    {
        get => (StaffRole)StaffRole;
        set => StaffRole = (byte)value;
    }

    [NotMapped]
    public bool IsActive
    {
        get => (StaffFlags & (byte)StaffFlagsEnum.IsActive) == (byte)StaffFlagsEnum.IsActive;
        set => StaffFlags = (byte)(value ? (StaffFlags | (byte)StaffFlagsEnum.IsActive) : (StaffFlags & ~(byte)StaffFlagsEnum.IsActive));
    }

    [NotMapped]
    public bool IsDeleted
    {
        get => (StaffFlags & (byte)StaffFlagsEnum.IsDeleted) == (byte)StaffFlagsEnum.IsDeleted;
        set => StaffFlags = (byte)(value ? (StaffFlags | (byte)StaffFlagsEnum.IsDeleted) : (StaffFlags & ~(byte)StaffFlagsEnum.IsDeleted));
    }
}
