using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[Route("api/stores/{storeId}/orders")]
[ApiController]
[Authorize]
public class StoreOrdersController : ApiControllerBase
{
    private readonly IStoreOrderService _orderService;

    public StoreOrdersController(IStoreOrderService orderService)
    {
        _orderService = orderService;
    }

    // GET: api/stores/{storeId}/orders
    [HttpGet]
    public async Task<IActionResult> GetOrders(Guid storeId, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var orders = await _orderService.GetStoreOrdersAsync(storeId, userId, ct);
            return Ok(orders);
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (InvalidOperationException ex)   { return NotFound(new { message = ex.Message }); }
    }

    // PUT: api/stores/{storeId}/orders/{orderId}/confirm
    [HttpPut("{orderId}/confirm")]
    public async Task<IActionResult> Confirm(Guid storeId, Guid orderId, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            await _orderService.ConfirmOrderAsync(orderId, storeId, userId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (InvalidOperationException ex)   { return BadRequest(new { message = ex.Message }); }
    }

    // PUT: api/stores/{storeId}/orders/{orderId}/ready
    [HttpPut("{orderId}/ready")]
    public async Task<IActionResult> MarkReady(Guid storeId, Guid orderId, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            await _orderService.MarkReadyForPickupAsync(orderId, storeId, userId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (InvalidOperationException ex)   { return BadRequest(new { message = ex.Message }); }
    }

    // PUT: api/stores/{storeId}/orders/{orderId}/complete
    [HttpPut("{orderId}/complete")]
    public async Task<IActionResult> Complete(Guid storeId, Guid orderId, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            await _orderService.CompleteOrderAsync(orderId, storeId, userId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (InvalidOperationException ex)   { return BadRequest(new { message = ex.Message }); }
    }

    // PUT: api/stores/{storeId}/orders/{orderId}/cancel
    [HttpPut("{orderId}/cancel")]
    public async Task<IActionResult> Cancel(Guid storeId, Guid orderId, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            await _orderService.CancelOrderAsync(orderId, storeId, userId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (InvalidOperationException ex)   { return BadRequest(new { message = ex.Message }); }
    }

    // GET: api/stores/{storeId}/orders/lookup?pickupCode=ABC123
    [HttpGet("lookup")]
    public async Task<IActionResult> LookupByPickupCode(Guid storeId, [FromQuery] string pickupCode, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var order = await _orderService.LookupOrderByPickupCodeAsync(storeId, pickupCode, userId, ct);
            return Ok(order);
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (InvalidOperationException ex)   { return NotFound(new { message = ex.Message }); }
    }

    // GET: api/stores/{storeId}/orders/export-csv
    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv(Guid storeId, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, CancellationToken ct = default)
    {
        try
        {
            var userId = GetRequiredUserId();
            var csvBytes = await _orderService.ExportOrdersCsvAsync(storeId, userId, from, to, ct);
            var fileName = $"store_orders_{storeId}_{DateTime.UtcNow:yyyyMMdd}.csv";
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (InvalidOperationException ex)   { return BadRequest(new { message = ex.Message }); }
    }
}
