using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class StoreSubscription
{
    [NotMapped]
    public SubscriptionStatus SubscriptionStatusEnum
    {
        get => (SubscriptionStatus)Status;
        set => Status = (byte)value;
    }
}
