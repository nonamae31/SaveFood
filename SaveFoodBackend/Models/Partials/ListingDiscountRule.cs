using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class ListingDiscountRule
{
    [NotMapped]
    public TriggerType TriggerTypeEnum
    {
        get => (TriggerType)TriggerType;
        set => TriggerType = (byte)value;
    }

    [NotMapped]
    public bool IsActive
    {
        get => (RuleFlags & (byte)RuleFlagsEnum.IsActive) == (byte)RuleFlagsEnum.IsActive;
        set => RuleFlags = (byte)(value ? (RuleFlags | (byte)RuleFlagsEnum.IsActive) : (RuleFlags & ~(byte)RuleFlagsEnum.IsActive));
    }

    [NotMapped]
    public bool IsDeleted
    {
        get => (RuleFlags & (byte)RuleFlagsEnum.IsDeleted) == (byte)RuleFlagsEnum.IsDeleted;
        set => RuleFlags = (byte)(value ? (RuleFlags | (byte)RuleFlagsEnum.IsDeleted) : (RuleFlags & ~(byte)RuleFlagsEnum.IsDeleted));
    }


}
