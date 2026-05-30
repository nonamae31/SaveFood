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
    [Authorize(Roles = "Store")]
    public class ReviewsController : ApiControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost("{reviewId}/reply")]
        public async Task<IActionResult> ReplyToReview([FromHeader(Name = "Store-Id")] Guid storeId, Guid reviewId, [FromBody] StoreReplyRequest request, CancellationToken ct)
        {
            if (storeId == Guid.Empty)
                return BadRequestResponse("Store-Id header is required.");

            var staffUserId = GetRequiredUserId();
            var result = await _reviewService.ReplyToReviewAsync(storeId, staffUserId, reviewId, request, ct);
            return OkResponse(result);
        }
    }
}
