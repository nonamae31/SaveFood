using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Auth;

namespace SaveFoodBackend.Interfaces;

public interface IAuthService
{
    Task<Guid> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<bool> VerifyOtpAsync(VerifyOtpRequest request);
    Task<bool> ResendOtpAsync(ResendOtpRequest request);
    Task<LoginResponse> GoogleLoginAsync(GoogleLoginRequest request);
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request);
}
