using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Customer.Reviews
{
    public class StoreReviewStatsResponse
    {
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }
        public int PendingReply { get; set; }
        public int HighRated { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new Dictionary<int, int>();
    }
}
