using System;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Admin
{
    public class SubscriptionPlanDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal MonthlyPrice { get; set; }
        public bool IsActive { get; set; }
        public int? MaxActiveListings { get; set; }
        public bool HasCustomBanner { get; set; }
        public bool HasFeaturedBadge { get; set; }
        public int PriorityLevel { get; set; }
        public int AnalyticsLevel { get; set; }
    }

    public class CreateSubscriptionPlanRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        [Required]
        [Range(0, 99999999.99)]
        public decimal MonthlyPrice { get; set; }

        public int? MaxActiveListings { get; set; }
        public bool HasCustomBanner { get; set; }
        public bool HasFeaturedBadge { get; set; }
        public int PriorityLevel { get; set; }
        public int AnalyticsLevel { get; set; }
    }

    public class UpdateSubscriptionPlanRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        [Required]
        [Range(0, 99999999.99)]
        public decimal MonthlyPrice { get; set; }

        public int? MaxActiveListings { get; set; }
        public bool HasCustomBanner { get; set; }
        public bool HasFeaturedBadge { get; set; }
        public int PriorityLevel { get; set; }
        public int AnalyticsLevel { get; set; }
    }
}
