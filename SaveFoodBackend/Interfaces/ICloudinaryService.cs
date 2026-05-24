using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace SaveFoodBackend.Interfaces
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file);
    }
}
