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
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DetailedAddress { get; set; } = null!;
        public string Ward { get; set; } = null!;
        public string City { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? LogoUrl { get; set; }
        public string? CoverUrl { get; set; }
        public string PlanName { get; set; } = "Free";
        public bool HasCustomBanner { get; set; } = false;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public byte Status { get; set; }
        public bool IsDeleted { get; set; }
    }

    public class StoreStatusActionRequest
    {
        [Required]
        public string Action { get; set; } = string.Empty; // "pause", "resume", "delete"
    }

    /// <summary>Payload để cập nhật thông tin cơ bản của cửa hàng.</summary>
    public class UpdateStoreProfileRequest
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = null!;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required, MaxLength(300)]
        public string DetailedAddress { get; set; } = null!;

        [Required, MaxLength(100)]
        public string Ward { get; set; } = null!;

        [Required, MaxLength(100)]
        public string City { get; set; } = null!;

        [Phone, MaxLength(20)]
        public string? PhoneNumber { get; set; }

        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }

    /// <summary>Payload để đăng ký mở cửa hàng mới.</summary>
    public class RegisterStoreRequest
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = null!;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required, MaxLength(300)]
        public string DetailedAddress { get; set; } = null!;

        [Required, MaxLength(100)]
        public string Ward { get; set; } = null!;

        [Required, MaxLength(100)]
        public string City { get; set; } = null!;

        [Required, Phone, MaxLength(20)]
        public string PhoneNumber { get; set; } = null!;

        public decimal? Latitude { get; set; }

        public decimal? Longitude { get; set; }

        public Guid? SubscriptionPlanId { get; set; }
        
        // BillingCycle can be added if needed, let's keep it simple or add it if they pay upfront.
        // For now SubscriptionPlanId is enough to identify which plan they selected.
        public string? BillingCycle { get; set; } // e.g., 'monthly', 'semiannual', 'annual'

        [MaxLength(1000)]
        public string? ReferenceLink { get; set; }

        public IFormFile? StorefrontImage { get; set; }
    }

    /// <summary>Dữ liệu danh sách đơn đăng ký cửa hàng của user.</summary>
    public class MyStoreRegistrationDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string DetailedAddress { get; set; } = null!;
        public int Status { get; set; }
        public string? RejectReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class ExtractMapLinkRequest
    {
        [Required, Url]
        public string Url { get; set; } = string.Empty;
    }

    public class ExtractMapLinkResponse
    {
        public string? Name { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }
}
