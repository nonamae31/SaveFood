using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Auth;

namespace SaveFoodBackend.Interfaces;

public interface IAuthService
{
    Task<Guid> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
}
