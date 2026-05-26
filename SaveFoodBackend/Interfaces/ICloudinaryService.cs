using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace SaveFoodBackend.Interfaces
{
    public interface ICloudinaryService
    {
        Task<(string SecureUrl, string PublicId)> UploadImageAsync(IFormFile file, string? existingPublicId = null);
    }
}
