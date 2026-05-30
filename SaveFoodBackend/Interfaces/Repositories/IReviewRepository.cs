using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories
{
    public interface IReviewRepository
    {
        Task AddAsync(Review review, CancellationToken ct = default);
        void Update(Review review);
        Task SaveChangesAsync(CancellationToken ct = default);
        Task<Review?> GetReviewWithImagesAsync(Guid reviewId, CancellationToken ct = default);
        Task<Review?> GetReviewByOrderItemIdAsync(Guid orderItemId, CancellationToken ct = default);
        Task<IEnumerable<Review>> GetReviewsByListingIdAsync(Guid listingId, CancellationToken ct = default);
        Task<IEnumerable<Review>> GetReviewsByProductIdAsync(Guid productId, CancellationToken ct = default);
        Task<IEnumerable<Review>> GetReviewsByStoreIdAsync(Guid storeId, CancellationToken ct = default);
        Task<OrderItem?> GetOrderItemWithOrderAsync(Guid orderItemId, CancellationToken ct = default);
        void RemoveReviewImages(IEnumerable<ReviewImage> images);
    }
}
