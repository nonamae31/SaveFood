using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class SubscriptionPlan
{
    [NotMapped]
    public bool IsActive
    {
        get => (PlanFlags & (byte)PlanFlagsEnum.IsActive) == (byte)PlanFlagsEnum.IsActive;
        set => PlanFlags = (byte)(value ? (PlanFlags | (byte)PlanFlagsEnum.IsActive) : (PlanFlags & ~(byte)PlanFlagsEnum.IsActive));
    }

    [NotMapped]
    public bool IsDeleted
    {
        get => (PlanFlags & (byte)PlanFlagsEnum.IsDeleted) == (byte)PlanFlagsEnum.IsDeleted;
        set => PlanFlags = (byte)(value ? (PlanFlags | (byte)PlanFlagsEnum.IsDeleted) : (PlanFlags & ~(byte)PlanFlagsEnum.IsDeleted));
    }
}
