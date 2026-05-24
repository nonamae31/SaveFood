using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Auth;

public class ResetPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string OtpCode { get; set; } = null!;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = null!;
}
