using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SaveFoodBackend.Application.Features.Complaints.Commands;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Complaints;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SaveFoodBackend.Controllers.Customer;

[ApiController]
[Route("api/v1/customer/complaints")]
[Authorize(Roles = "CUSTOMER,Customer")]
public class CustomerComplaintsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomerComplaintsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("presigned-url")]
    [EnableRateLimiting("FixedWindow")]
    public async Task<IActionResult> GetPresignedUrl([FromBody] GetPresignedUrlCommand command)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Invalid request payload."
            });
        }

        var url = await _mediator.Send(command);
        return Ok(new ApiResponse { Success = true, Data = url });
    }

    [HttpPost]
    [EnableRateLimiting("FixedWindow")]
    public async Task<IActionResult> CreateComplaint([FromBody] CreateComplaintDto payload)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "Invalid request payload."
            });
        }

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var customerId))
        {
            return Unauthorized();
        }

        var command = new CreateComplaintCommand
        {
            CustomerId = customerId,
            Payload = payload
        };

        var result = await _mediator.Send(command);
        return Ok(new ApiResponse { Success = true, Data = result });
    }
}
