using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces;

public interface IJwtProvider
{
    string GenerateJwtToken(User user, string sessionId, Guid? storeId = null);
    string GenerateQrToken(Guid orderId);
    Guid? ValidateQrToken(string token);
}
