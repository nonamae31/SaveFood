using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class SubscriptionPlan
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal MonthlyPrice { get; set; }

    public byte PlanFlags { get; set; }

    public virtual ICollection<StoreSubscription> StoreSubscriptions { get; set; } = new List<StoreSubscription>();
}
