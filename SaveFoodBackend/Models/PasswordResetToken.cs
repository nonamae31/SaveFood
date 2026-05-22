using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class PasswordResetToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string ResetToken { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? UsedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
