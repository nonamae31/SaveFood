using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class StoreStaff
{
    public Guid Id { get; set; }

    public Guid StoreId { get; set; }

    public Guid UserId { get; set; }

    public byte StaffRole { get; set; }

    public byte StaffFlags { get; set; }

    public DateTime JoinedAt { get; set; }

    public virtual Store Store { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
