using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SaveFoodBackend.DTOs.Store
{
    public class UpdateStoreImagesRequest
    {
        public IFormFile? Logo { get; set; }
        public IFormFile? Banner { get; set; }
    }

    /// <summary>Dữ liệu hồ sơ cửa hàng trả về cho Dashboard.</summary>
    public class StoreProfileDTO
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string AddressLine { get; set; } = null!;
        public string? Ward { get; set; }
        public string District { get; set; } = null!;
        public string City { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? LogoUrl { get; set; }
        public string? CoverUrl { get; set; }
    }

    /// <summary>Payload để cập nhật thông tin cơ bản của cửa hàng.</summary>
    public class UpdateStoreProfileRequest
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = null!;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required, MaxLength(300)]
        public string AddressLine { get; set; } = null!;

        [MaxLength(100)]
        public string? Ward { get; set; }

        [Required, MaxLength(100)]
        public string District { get; set; } = null!;

        [Required, MaxLength(100)]
        public string City { get; set; } = null!;

        [Phone, MaxLength(20)]
        public string? PhoneNumber { get; set; }
    }
}
