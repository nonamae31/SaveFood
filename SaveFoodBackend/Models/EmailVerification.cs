using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class EmailVerification
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string VerificationCode { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
