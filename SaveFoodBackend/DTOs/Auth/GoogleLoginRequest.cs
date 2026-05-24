using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Auth;

public class GoogleLoginRequest
{
    [Required]
    public string Token { get; set; } = null!;
}
