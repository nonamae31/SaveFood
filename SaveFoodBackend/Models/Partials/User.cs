using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class User
{
    // Restored properties missing from scaffolded DB
    public string Username { get; set; } = null!;
    
    public string NormalizedEmail { get; set; } = null!;
    
    public string? ImgCloudinaryId { get; set; }

    [NotMapped]
    public UserStatus UserStatusEnum
    {
        get => (UserStatus)Status;
        set => Status = (byte)value;
    }

    [NotMapped]
    public bool IsMale
    {
        get => (UserFlags & (byte)UserFlagsEnum.IsMale) == (byte)UserFlagsEnum.IsMale;
        set => UserFlags = (byte)(value ? (UserFlags | (byte)UserFlagsEnum.IsMale) : (UserFlags & ~(byte)UserFlagsEnum.IsMale));
    }

    [NotMapped]
    public bool IsDeleted
    {
        get => (UserFlags & (byte)UserFlagsEnum.IsDeleted) == (byte)UserFlagsEnum.IsDeleted;
        set => UserFlags = (byte)(value ? (UserFlags | (byte)UserFlagsEnum.IsDeleted) : (UserFlags & ~(byte)UserFlagsEnum.IsDeleted));
    }

    [NotMapped]
    public bool EmailVerified
    {
        get => (UserFlags & (byte)UserFlagsEnum.EmailVerified) == (byte)UserFlagsEnum.EmailVerified;
        set => UserFlags = (byte)(value ? (UserFlags | (byte)UserFlagsEnum.EmailVerified) : (UserFlags & ~(byte)UserFlagsEnum.EmailVerified));
    }

    [NotMapped]
    public bool PhoneVerified
    {
        get => (UserFlags & (byte)UserFlagsEnum.PhoneVerified) == (byte)UserFlagsEnum.PhoneVerified;
        set => UserFlags = (byte)(value ? (UserFlags | (byte)UserFlagsEnum.PhoneVerified) : (UserFlags & ~(byte)UserFlagsEnum.PhoneVerified));
    }
}
