using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Customer.Reviews;
using SaveFoodBackend.DTOs.Store.Reviews;

namespace SaveFoodBackend.Interfaces.Services
{
    public interface IReviewService
    {
        Task<ReviewResponse> CreateReviewAsync(Guid userId, Guid orderItemId, ReviewRequest request, CancellationToken ct = default);
        Task<ReviewResponse> UpdateReviewAsync(Guid userId, Guid reviewId, ReviewRequest request, CancellationToken ct = default);
        Task DeleteReviewAsync(Guid userId, Guid reviewId, CancellationToken ct = default);
        
        Task<IEnumerable<ReviewResponse>> GetReviewsByListingIdAsync(Guid listingId, CancellationToken ct = default);
        Task<IEnumerable<ReviewResponse>> GetReviewsByProductIdAsync(Guid productId, CancellationToken ct = default);
        Task<IEnumerable<ReviewResponse>> GetReviewsByStoreIdAsync(Guid storeId, CancellationToken ct = default);
        Task<StoreReviewStatsResponse> GetStoreReviewStatsAsync(Guid storeId, CancellationToken ct = default);
        
        Task<ReviewResponse> ReplyToReviewAsync(Guid storeId, Guid staffUserId, Guid reviewId, StoreReplyRequest request, CancellationToken ct = default);
    }
}
