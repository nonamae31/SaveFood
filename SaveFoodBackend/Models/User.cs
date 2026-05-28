using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class User
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string? Address { get; set; }

    public string? AvatarUrl { get; set; }

    public byte Status { get; set; }

    public byte UserFlags { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? Username { get; set; }

    public string? NormalizedEmail { get; set; }

    public string? ImgCloudinaryId { get; set; }

    public virtual Cart? Cart { get; set; }

    public virtual ICollection<EmailVerification> EmailVerifications { get; set; } = new List<EmailVerification>();

    public virtual ICollection<Order> OrderConfirmedBies { get; set; } = new List<Order>();

    public virtual ICollection<Order> OrderUsers { get; set; } = new List<Order>();

    public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

    public virtual ICollection<RefundRequest> RefundRequests { get; set; } = new List<RefundRequest>();

    public virtual ICollection<StoreStaff> StoreStaffs { get; set; } = new List<StoreStaff>();

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
}
