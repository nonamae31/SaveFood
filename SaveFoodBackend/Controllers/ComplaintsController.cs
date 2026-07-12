using System;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Application.Features.Complaints.Commands;
using SaveFoodBackend.Application.Features.Complaints.Queries;
using SaveFoodBackend.DTOs.Complaints;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/v1/complaints")]
[Authorize]
public class ComplaintsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICloudinaryService _cloudinaryService;

    public ComplaintsController(IMediator mediator, ICloudinaryService cloudinaryService)
    {
        _mediator = mediator;
        _cloudinaryService = cloudinaryService;
    }

    [HttpPost("presigned-url")]
    public async Task<IActionResult> GetPresignedUrl([FromQuery] string fileName)
    {
        var url = await _mediator.Send(new GetPresignedUrlCommand { FileName = fileName });
        return Ok(new { url });
    }

    [HttpPost]
    public async Task<IActionResult> CreateComplaint([FromBody] CreateComplaintDto dto)
    {
        var customerIdStr = User.FindFirst("sub")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(customerIdStr, out var customerId))
            return Unauthorized();

        var result = await _mediator.Send(new CreateComplaintCommand { CustomerId = customerId, Payload = dto });
        return CreatedAtAction(nameof(GetComplaint), new { id = result.Id }, result);
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file provided");

        try
        {
            var (secureUrl, _) = await _cloudinaryService.UploadFileAsync(file);
            return Ok(new { success = true, data = secureUrl, url = secureUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPatch("{id}/stop-request")]
    [HttpPost("{id}/stop-request")]
    public async Task<IActionResult> RequestStopComplaint(Guid id, [FromQuery] string? role = null)
    {
        var userIdStr = User.FindFirst("sub")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);

        var callerRole = !string.IsNullOrEmpty(role) ? role : (User.FindFirstValue(ClaimTypes.Role) ?? "Shop");

        var success = await _mediator.Send(new RequestStopComplaintCommand
        {
            ComplaintId = id,
            ActionBy = userId,
            Role = callerRole
        });

        if (!success) return BadRequest(new { success = false, message = "Cannot request stop for this complaint" });
        return Ok(new { success = true });
    }

    [HttpPatch("{id}/confirm-stop")]
    [HttpPost("{id}/confirm-stop")]
    public async Task<IActionResult> ConfirmStopComplaint(Guid id)
    {
        var userIdStr = User.FindFirst("sub")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);

        var success = await _mediator.Send(new ConfirmStopComplaintCommand
        {
            ComplaintId = id,
            ActionBy = userId
        });

        if (!success) return BadRequest(new { success = false, message = "Cannot confirm stop for this complaint" });
        return Ok(new { success = true });
    }

    [HttpPatch("{id}/reject-stop")]
    [HttpPost("{id}/reject-stop")]
    public async Task<IActionResult> RejectStopComplaint(Guid id)
    {
        var userIdStr = User.FindFirst("sub")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdStr, out var userId);

        var success = await _mediator.Send(new RejectStopComplaintCommand
        {
            ComplaintId = id,
            ActionBy = userId
        });

        if (!success) return BadRequest(new { success = false, message = "Cannot reject stop for this complaint" });
        return Ok(new { success = true });
    }


    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] Guid? storeId, [FromQuery] ComplaintStatusEnum? status, [FromQuery] int page = 1, [FromQuery] int size = 10)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userIdStr = User.FindFirst("sub")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        Guid? queryCustomerId = null;
        Guid? queryStoreId = storeId;

        if (role == "Customer")
        {
            queryCustomerId = userId;
        }

        var result = await _mediator.Send(new GetComplaintsQuery 
        { 
            CustomerId = queryCustomerId, 
            StoreId = queryStoreId, 
            Status = status, 
            PageIndex = page, 
            PageSize = size 
        });

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetComplaint(Guid id)
    {
        var result = await _mediator.Send(new GetComplaintDetailQuery { Id = id });
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateComplaintStatusDto dto)
    {
        var userIdStr = User.FindFirst("sub")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var success = await _mediator.Send(new UpdateComplaintStatusCommand 
        { 
            ComplaintId = id, 
            ActionBy = userId,
            Payload = dto 
        });

        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/messages")]
    public async Task<IActionResult> AddMessage(Guid id, [FromBody] AddComplaintMessageDto dto)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";
        var userIdStr = User.FindFirst("sub")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        try
        {
            var result = await _mediator.Send(new AddComplaintMessageCommand 
            { 
                ComplaintId = id, 
                SenderId = userId,
                SenderRole = role,
                Payload = dto 
            });
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}
