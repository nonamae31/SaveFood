using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Interfaces;
using MediatR;

namespace SaveFoodBackend.Controllers;

[Route("api/stores/{storeId}/orders")]
[ApiController]
[Authorize]
public class StoreOrdersController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public StoreOrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // GET: api/stores/{storeId}/orders
    [HttpGet]
    public async Task<IActionResult> GetOrders(Guid storeId, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var orders = await _mediator.Send(new Application.StoreOrders.Queries.GetStoreOrdersQuery(storeId, userId), ct);
        return Ok(orders);
    }

    // PUT: api/stores/{storeId}/orders/{orderId}/confirm
    [HttpPut("{orderId}/confirm")]
    public async Task<IActionResult> Confirm(Guid storeId, Guid orderId, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        await _mediator.Send(new Application.StoreOrders.Commands.ConfirmOrderCommand(orderId, storeId, userId), ct);
        return NoContent();
    }

    // PUT: api/stores/{storeId}/orders/{orderId}/ready
    [HttpPut("{orderId}/ready")]
    public async Task<IActionResult> MarkReady(Guid storeId, Guid orderId, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        await _mediator.Send(new Application.StoreOrders.Commands.MarkReadyCommand(orderId, storeId, userId), ct);
        return NoContent();
    }

    // PUT: api/stores/{storeId}/orders/{orderId}/cancel
    [HttpPut("{orderId}/cancel")]
    public async Task<IActionResult> Cancel(Guid storeId, Guid orderId, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        await _mediator.Send(new Application.StoreOrders.Commands.CancelStoreOrderCommand(orderId, storeId, userId), ct);
        return NoContent();
    }

    // GET: api/stores/{storeId}/orders/lookup?pickupCode=ABC123
    [HttpGet("lookup")]
    public async Task<IActionResult> LookupByPickupCode(Guid storeId, [FromQuery] string pickupCode, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var order = await _mediator.Send(new Application.StoreOrders.Queries.LookupOrderByPickupCodeQuery(storeId, pickupCode, userId), ct);
        return Ok(order);
    }

    // GET: api/stores/{storeId}/orders/export-csv
    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv(Guid storeId, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, CancellationToken ct = default)
    {
        var userId = GetRequiredUserId();
        var csvBytes = await _mediator.Send(new Application.StoreOrders.Queries.ExportOrdersCsvQuery(storeId, userId, from, to), ct);
        var fileName = $"store_orders_{storeId}_{DateTime.UtcNow:yyyyMMdd}.csv";
        return File(csvBytes, "text/csv; charset=utf-8", fileName);
    }
}
