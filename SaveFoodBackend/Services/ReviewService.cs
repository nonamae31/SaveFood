using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Customer.Reviews;
using SaveFoodBackend.DTOs.Store.Reviews;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Interfaces.Services;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepo;
        private readonly IStoreRepository _storeRepo;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ISentimentService _sentimentService;
        private readonly INotificationService _notifService;

        public ReviewService(
            IReviewRepository reviewRepo,
            IStoreRepository storeRepo,
            ICloudinaryService cloudinaryService,
            ISentimentService sentimentService,
            INotificationService notifService)
        {
            _reviewRepo = reviewRepo;
            _storeRepo = storeRepo;
            _cloudinaryService = cloudinaryService;
            _sentimentService = sentimentService;
            _notifService = notifService;
        }

        private ReviewResponse MapToDTO(Review review)
        {
            return new ReviewResponse
            {
                Id = review.Id,
                OrderItemId = review.OrderItemId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt,
                StoreReply = review.StoreReply,
                StoreReplyAt = review.StoreReplyAt,
                Images = review.ReviewImages?.Select(img => img.ImageUrl).ToList() ?? new List<string>(),
                CustomerName = review.OrderItem?.Order?.User?.FullName ?? "KhÃ¡ch hÃ ng",
                CustomerAvatar = review.OrderItem?.Order?.User?.AvatarUrl,
                SentimentLabel = review.SentimentLabel,
                SentimentScore = review.SentimentScore
            };
        }

        public async Task<ReviewResponse> CreateReviewAsync(Guid userId, Guid orderItemId, ReviewRequest request, CancellationToken ct = default)
        {
            var orderItem = await _reviewRepo.GetOrderItemWithOrderAsync(orderItemId, ct);
            if (orderItem == null)
                throw new InvalidOperationException("MÃ³n hÃ ng khÃ´ng tá»“n táº¡i.");

            if (orderItem.Order.UserId != userId)
                throw new UnauthorizedAccessException("Báº¡n khÃ´ng cÃ³ quyá»n Ä‘Ã¡nh giÃ¡ Ä‘Æ¡n hÃ ng nÃ y.");

            // Check if order is completed
            if (orderItem.Order.OrderStatus != OrderStatusEnum.Completed)
                throw new InvalidOperationException("Chỉ có thể đánh giá các đơn hàng đã hoàn thành.");

            // Check 7 day window
            var orderCompletedAt = orderItem.Order.CreatedAt; // or Payment.CreatedAt if available
            if ((DateTime.UtcNow - orderCompletedAt).TotalDays > 7)
                throw new InvalidOperationException("ÄÃ£ quÃ¡ thá»i háº¡n 7 ngÃ y Ä‘á»ƒ Ä‘Ã¡nh giÃ¡ mÃ³n hÃ ng nÃ y.");

            var existingReview = await _reviewRepo.GetReviewByOrderItemIdAsync(orderItemId, ct);
            if (existingReview != null)
                throw new InvalidOperationException("Báº¡n Ä‘Ã£ Ä‘Ã¡nh giÃ¡ mÃ³n hÃ ng nÃ y rá»“i (hoáº·c Ä‘Ã¡nh giÃ¡ Ä‘Ã£ bá»‹ xoÃ¡).");

            if (request.Images != null && request.Images.Count > 5)
                throw new InvalidOperationException("Chá»‰ Ä‘Æ°á»£c phÃ©p táº£i lÃªn tá»‘i Ä‘a 5 hÃ¬nh áº£nh.");

            var review = new Review
            {
                Id = Guid.NewGuid(),
                OrderItemId = orderItemId,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow,
                ReviewFlags = (byte)ReviewFlagsEnum.None
            };

            if (request.Images != null && request.Images.Any())
            {
                foreach (var img in request.Images)
                {
                    var (url, publicId) = await _cloudinaryService.UploadImageAsync(img);
                    review.ReviewImages.Add(new ReviewImage
                    {
                        Id = Guid.NewGuid(),
                        ReviewId = review.Id,
                        ImageUrl = url,
                        CloudinaryPublicId = publicId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // Call sentiment service
            var sentiment = await _sentimentService.AnalyzeSentimentAsync(request.Comment, ct);
            review.SentimentLabel = sentiment.Label;
            review.SentimentScore = sentiment.Score;

            await _reviewRepo.AddAsync(review, ct);
            await _reviewRepo.SaveChangesAsync(ct);

            // Notify store owner/staff about new review
            var storeId = orderItem.Order.StoreId;
            var staffIds = await _storeRepo.GetStoreWithStaffsAsync(storeId, ct);
            if (staffIds?.StoreStaffs != null)
            {
                foreach (var staff in staffIds.StoreStaffs)
                {
                    await _notifService.SendAsync(
                        staff.UserId,
                        "CÃ³ Ä‘Ã¡nh giÃ¡ má»›i â­",
                        $"Cá»­a hÃ ng vá»«a nháº­n Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ {request.Rating} sao. HÃ£y pháº£n há»“i khÃ¡ch hÃ ng!",
                        "NEW_REVIEW",
                        review.Id
                    );
                }
            }

            // Load nav props for response
            review.OrderItem = orderItem;

            return MapToDTO(review);
        }

        public async Task<ReviewResponse> UpdateReviewAsync(Guid userId, Guid reviewId, ReviewRequest request, CancellationToken ct = default)
        {
            var review = await _reviewRepo.GetReviewWithImagesAsync(reviewId, ct);
            if (review == null)
                throw new InvalidOperationException("ÄÃ¡nh giÃ¡ khÃ´ng tá»“n táº¡i.");

            if (review.OrderItem.Order.UserId != userId)
                throw new UnauthorizedAccessException("Báº¡n khÃ´ng cÃ³ quyá»n sá»­a Ä‘Ã¡nh giÃ¡ nÃ y.");

            var orderCompletedAt = review.OrderItem.Order.CreatedAt;
            if ((DateTime.UtcNow - orderCompletedAt).TotalDays > 7)
                throw new InvalidOperationException("ÄÃ£ quÃ¡ thá»i háº¡n 7 ngÃ y, khÃ´ng thá»ƒ sá»­a Ä‘Ã¡nh giÃ¡.");

            if (request.Images != null && request.Images.Count > 5)
                throw new InvalidOperationException("Chá»‰ Ä‘Æ°á»£c phÃ©p táº£i lÃªn tá»‘i Ä‘a 5 hÃ¬nh áº£nh.");

            review.Rating = request.Rating;
            review.Comment = request.Comment;
            review.UpdatedAt = DateTime.UtcNow;
            
            // Delete store reply if any
            review.StoreReply = null;
            review.StoreReplyAt = null;

            // Call sentiment service
            var sentiment = await _sentimentService.AnalyzeSentimentAsync(request.Comment, ct);
            review.SentimentLabel = sentiment.Label;
            review.SentimentScore = sentiment.Score;

            // Process images (replace all if new images provided, or if empty array)
            if (request.Images != null)
            {
                foreach(var oldImg in review.ReviewImages)
                {
                    if (!string.IsNullOrEmpty(oldImg.CloudinaryPublicId))
                    {
                        await _cloudinaryService.DeleteImageAsync(oldImg.CloudinaryPublicId);
                    }
                }

                _reviewRepo.RemoveReviewImages(review.ReviewImages);
                review.ReviewImages.Clear();

                foreach (var img in request.Images)
                {
                    var (url, publicId) = await _cloudinaryService.UploadImageAsync(img);
                    review.ReviewImages.Add(new ReviewImage
                    {
                        Id = Guid.NewGuid(),
                        ReviewId = review.Id,
                        ImageUrl = url,
                        CloudinaryPublicId = publicId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            _reviewRepo.Update(review);
            await _reviewRepo.SaveChangesAsync(ct);

            return MapToDTO(review);
        }

        public async Task DeleteReviewAsync(Guid userId, Guid reviewId, CancellationToken ct = default)
        {
            var review = await _reviewRepo.GetReviewWithImagesAsync(reviewId, ct);
            if (review == null)
                throw new InvalidOperationException("ÄÃ¡nh giÃ¡ khÃ´ng tá»“n táº¡i.");

            if (review.OrderItem.Order.UserId != userId)
                throw new UnauthorizedAccessException("Báº¡n khÃ´ng cÃ³ quyá»n xoÃ¡ Ä‘Ã¡nh giÃ¡ nÃ y.");

            review.ReviewFlags |= (byte)ReviewFlagsEnum.IsDeleted;
            _reviewRepo.Update(review);
            await _reviewRepo.SaveChangesAsync(ct);
        }

        public async Task<IEnumerable<ReviewResponse>> GetReviewsByListingIdAsync(Guid listingId, CancellationToken ct = default)
        {
            var reviews = await _reviewRepo.GetReviewsByListingIdAsync(listingId, ct);
            return reviews.Select(MapToDTO);
        }

        public async Task<IEnumerable<ReviewResponse>> GetReviewsByProductIdAsync(Guid productId, CancellationToken ct = default)
        {
            var reviews = await _reviewRepo.GetReviewsByProductIdAsync(productId, ct);
            return reviews.Select(MapToDTO);
        }

        public async Task<IEnumerable<ReviewResponse>> GetReviewsByStoreIdAsync(Guid storeId, CancellationToken ct = default)
        {
            var reviews = await _reviewRepo.GetReviewsByStoreIdAsync(storeId, ct);
            return reviews.Select(MapToDTO);
        }

        public async Task<StoreReviewStatsResponse> GetStoreReviewStatsAsync(Guid storeId, CancellationToken ct = default)
        {
            var reviews = await _reviewRepo.GetReviewsByStoreIdAsync(storeId, ct);
            
            var stats = new StoreReviewStatsResponse();
            stats.TotalReviews = reviews.Count();
            if (stats.TotalReviews > 0)
            {
                stats.AverageRating = Math.Round(reviews.Average(r => r.Rating), 1);
                stats.PendingReply = reviews.Count(r => string.IsNullOrEmpty(r.StoreReply));
                stats.HighRated = reviews.Count(r => r.Rating >= 4);
                
                for (int i = 1; i <= 5; i++)
                {
                    stats.RatingDistribution[i] = reviews.Count(r => r.Rating == i);
                }
            }
            else
            {
                for (int i = 1; i <= 5; i++)
                {
                    stats.RatingDistribution[i] = 0;
                }
            }

            return stats;
        }

        public async Task<ReviewResponse> ReplyToReviewAsync(Guid storeId, Guid staffUserId, Guid reviewId, StoreReplyRequest request, CancellationToken ct = default)
        {
            var store = await _storeRepo.GetStoreWithStaffsAsync(storeId, ct);
            if (store == null || !store.StoreStaffs.Any(s => s.UserId == staffUserId))
                throw new UnauthorizedAccessException("Báº¡n khÃ´ng cÃ³ quyá»n thao tÃ¡c trÃªn cá»­a hÃ ng nÃ y.");

            var review = await _reviewRepo.GetReviewWithImagesAsync(reviewId, ct);
            if (review == null)
                throw new InvalidOperationException("ÄÃ¡nh giÃ¡ khÃ´ng tá»“n táº¡i.");

            if (review.OrderItem.Order.StoreId != storeId)
                throw new InvalidOperationException("ÄÃ¡nh giÃ¡ nÃ y khÃ´ng thuá»™c vá» cá»­a hÃ ng cá»§a báº¡n.");

            review.StoreReply = request.ReplyText;
            review.StoreReplyAt = DateTime.UtcNow;

            _reviewRepo.Update(review);
            await _reviewRepo.SaveChangesAsync(ct);

            // Notify customer that store replied
            var customerUserId = review.OrderItem?.Order?.UserId;
            if (customerUserId.HasValue)
            {
                await _notifService.SendAsync(
                    customerUserId.Value,
                    "Cua hang da phan hoi danh gia 💬",
                    $"{store.Name} vua tra loi danh gia.",
                    "REVIEW_REPLIED",
                    review.Id
                );
            }

            return MapToDTO(review);
        }
    }
}


