using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class Role
{
    public Guid Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
