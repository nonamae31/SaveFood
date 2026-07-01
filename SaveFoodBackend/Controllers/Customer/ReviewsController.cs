using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Customer.Reviews;
using SaveFoodBackend.Interfaces.Services;
using SaveFoodBackend.Extensions;

namespace SaveFoodBackend.Controllers.Customer
{
    [ApiController]
    [Route("api/customer/reviews")]
    [Authorize]
    public class ReviewsController : ApiControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost("{orderItemId}")]
        public async Task<IActionResult> CreateReview(Guid orderItemId, [FromForm] ReviewRequest request, CancellationToken ct)
        {
            var userId = GetRequiredUserId();
            var result = await _reviewService.CreateReviewAsync(userId, orderItemId, request, ct);
            return OkResponse(result);
        }

        [HttpPut("{reviewId}")]
        public async Task<IActionResult> UpdateReview(Guid reviewId, [FromForm] ReviewRequest request, CancellationToken ct)
        {
            var userId = GetRequiredUserId();
            var result = await _reviewService.UpdateReviewAsync(userId, reviewId, request, ct);
            return OkResponse(result);
        }

        [HttpDelete("{reviewId}")]
        public async Task<IActionResult> DeleteReview(Guid reviewId, CancellationToken ct)
        {
            var userId = GetRequiredUserId();
            await _reviewService.DeleteReviewAsync(userId, reviewId, ct);
            return NoContentResponse();
        }

        [AllowAnonymous]
        [HttpGet("listing/{listingId}")]
        public async Task<IActionResult> GetReviewsByListing(Guid listingId, CancellationToken ct)
        {
            var reviews = await _reviewService.GetReviewsByListingIdAsync(listingId, ct);
            return OkResponse(reviews);
        }
        
        [AllowAnonymous]
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetReviewsByProduct(Guid productId, CancellationToken ct)
        {
            var reviews = await _reviewService.GetReviewsByProductIdAsync(productId, ct);
            return OkResponse(reviews);
        }
        
        [AllowAnonymous]
        [HttpGet("store/{storeId}")]
        public async Task<IActionResult> GetReviewsByStore(Guid storeId, CancellationToken ct)
        {
            var reviews = await _reviewService.GetReviewsByStoreIdAsync(storeId, ct);
            return OkResponse(reviews);
        }
    }
}
