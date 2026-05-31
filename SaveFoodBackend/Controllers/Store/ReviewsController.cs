using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Store.Reviews;
using SaveFoodBackend.Interfaces.Services;
using SaveFoodBackend.Extensions;

namespace SaveFoodBackend.Controllers.Store
{
    [ApiController]
    [Route("api/store/reviews")]
    [Authorize(Roles = "STORE,Store")]
    public class ReviewsController : ApiControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyStoreReviews(CancellationToken ct)
        {
            var storeId = GetRequiredStoreId();
            var reviews = await _reviewService.GetReviewsByStoreIdAsync(storeId, ct);
            return OkResponse(reviews);
        }

        [HttpPost("{reviewId}/reply")]
        public async Task<IActionResult> ReplyToReview(Guid reviewId, [FromBody] StoreReplyRequest request, CancellationToken ct)
        {
            var storeId = GetRequiredStoreId();
            var staffUserId = GetRequiredUserId();
            var result = await _reviewService.ReplyToReviewAsync(storeId, staffUserId, reviewId, request, ct);
            return OkResponse(result);
        }
    }
}

