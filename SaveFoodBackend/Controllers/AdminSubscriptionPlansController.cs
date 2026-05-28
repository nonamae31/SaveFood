using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers
{
    [Route("api/admin/subscription-plans")]
    [ApiController]
    [Authorize(Roles = "ADMIN,Admin")] // Uncomment when auth is re-enabled globally
    public class AdminSubscriptionPlansController : ControllerBase
    {
        private readonly ISubscriptionPlanService _subscriptionPlanService;

        public AdminSubscriptionPlansController(ISubscriptionPlanService subscriptionPlanService)
        {
            _subscriptionPlanService = subscriptionPlanService;
        }

        // GET: api/admin/subscription-plans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SubscriptionPlanDTO>>> GetAllPlans()
        {
            var plans = await _subscriptionPlanService.GetAllPlansAsync();
            return Ok(plans);
        }

        // GET: api/admin/subscription-plans/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<SubscriptionPlanDTO>> GetPlanById(Guid id)
        {
            var plan = await _subscriptionPlanService.GetPlanByIdAsync(id);

            if (plan == null)
            {
                return NotFound(new { message = "Subscription Plan not found." });
            }

            return Ok(plan);
        }

        // POST: api/admin/subscription-plans
        [HttpPost]
        public async Task<ActionResult<SubscriptionPlanDTO>> CreatePlan([FromBody] CreateSubscriptionPlanRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var plan = await _subscriptionPlanService.CreatePlanAsync(request);
            return CreatedAtAction(nameof(GetPlanById), new { id = plan.Id }, plan);
        }

        // PUT: api/admin/subscription-plans/{id}
        [HttpPut("{id}")]
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

        // DELETE: api/admin/subscription-plans/{id}
        [HttpDelete("{id}")]
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
