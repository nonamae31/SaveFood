using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers
{
    [Route("api/subscription-plans")]
    [ApiController]
    public class SubscriptionPlansController : ControllerBase
    {
        private readonly ISubscriptionPlanService _subscriptionPlanService;

        public SubscriptionPlansController(ISubscriptionPlanService subscriptionPlanService)
        {
            _subscriptionPlanService = subscriptionPlanService;
        }

        // GET: api/subscription-plans
        [HttpGet]
        [Authorize] // Allow any authenticated user to view plans (or [AllowAnonymous])
        public async Task<ActionResult<IEnumerable<SubscriptionPlanDTO>>> GetAllPlans()
        {
            var plans = await _subscriptionPlanService.GetAllPlansAsync();
            return Ok(plans);
        }

        // GET: api/subscription-plans/{id}
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<SubscriptionPlanDTO>> GetPlanById(Guid id)
        {
            var plan = await _subscriptionPlanService.GetPlanByIdAsync(id);

            if (plan == null)
            {
                return NotFound(new { message = "Subscription Plan not found." });
            }

            return Ok(plan);
        }

        // POST: api/subscription-plans
        [HttpPost]
        [Authorize(Roles = "ADMIN,Admin")]
        public async Task<ActionResult<SubscriptionPlanDTO>> CreatePlan([FromBody] CreateSubscriptionPlanRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var plan = await _subscriptionPlanService.CreatePlanAsync(request);
            return CreatedAtAction(nameof(GetPlanById), new { id = plan.Id }, plan);
        }

        // PUT: api/subscription-plans/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,Admin")]
        public async Task<ActionResult<SubscriptionPlanDTO>> UpdatePlan(Guid id, [FromBody] UpdateSubscriptionPlanRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var plan = await _subscriptionPlanService.UpdatePlanAsync(id, request);
                return Ok(plan);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // DELETE: api/subscription-plans/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,Admin")]
        public async Task<IActionResult> DeletePlan(Guid id)
        {
            try
            {
                await _subscriptionPlanService.DeletePlanAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
