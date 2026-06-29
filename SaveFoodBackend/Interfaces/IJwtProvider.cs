using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces;

public interface IJwtProvider
{
    string GenerateJwtToken(User user, string sessionId);
}
