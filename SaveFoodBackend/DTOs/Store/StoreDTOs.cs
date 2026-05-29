using Microsoft.AspNetCore.Http;

namespace SaveFoodBackend.DTOs.Store
{
    public class UpdateStoreImagesRequest
    {
        public IFormFile? Logo { get; set; }
        public IFormFile? Banner { get; set; }
    }
}
