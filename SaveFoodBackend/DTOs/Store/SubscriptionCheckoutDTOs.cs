using System;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Store
{
    public class SubscriptionCheckoutRequest
    {
        [Required]
        public Guid PlanId { get; set; }

        [Required]
        [RegularExpression("monthly|semiannual|annual", ErrorMessage = "Chu kỳ thanh toán không hợp lệ.")]
        public string BillingCycle { get; set; } = "monthly";
    }

    public class SubscriptionCheckoutResponse
    {
        public Guid SubscriptionId { get; set; }
        public string CheckoutUrl { get; set; } = string.Empty;
    }
}
