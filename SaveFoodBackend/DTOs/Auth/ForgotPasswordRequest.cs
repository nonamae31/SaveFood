using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Auth;

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
}
