using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Utils;
using MediatR;

namespace SaveFoodBackend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrdersController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [Authorize]
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequestDTO req, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var result = await _mediator.Send(new Application.Orders.Commands.CheckoutCommand(userId, req), ct);
        return Ok(result);
    }

    [HttpPost("pay-batch")]
    public async Task<IActionResult> BatchPay([FromBody] BatchPayRequestDTO req, CancellationToken ct)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
            var result = await _mediator.Send(new Application.Orders.Commands.BatchPayCommand(userId, req.OrderIds, req.PaymentMethod, req.ReturnUrl, req.CancelUrl), ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetMyOrders([FromQuery] int? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 5, CancellationToken ct = default)
    {
        var userId = GetRequiredUserId();
        var result = await _mediator.Send(new Application.Orders.Queries.GetMyOrdersQuery(userId, status, page, pageSize), ct);
        return Ok(new { success = true, data = result });
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var result = await _mediator.Send(new Application.Orders.Queries.GetOrderByIdQuery(id, userId), ct);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "STORE")]
    [HttpPost("{id}/verify-pickup")]
    public async Task<IActionResult> VerifyPickup(Guid id, [FromBody] VerifyPickupRequestDTO req, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var success = await _mediator.Send(new Application.Orders.Commands.VerifyPickupCommand(id, req.PickupCode, userId), ct);
        return Ok(new { success = success, message = "Xác nhận nhận hàng thành công." });
    }

    [Authorize]
    [HttpPut("{id}/extend-pickup")]
    public async Task<IActionResult> ExtendPickupTime(Guid id, [FromBody] ExtendPickupRequestDTO req, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var success = await _mediator.Send(new Application.Orders.Commands.ExtendPickupTimeCommand(id, userId, req.AdditionalMinutes), ct);
        return Ok(new { success = success, message = "Gia hạn thời gian lấy hàng thành công." });
    }

    [Authorize]
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id, [FromBody] CancelOrderRequestDTO req, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var success = await _mediator.Send(new Application.Orders.Commands.CancelOrderCommand(id, userId, req), ct);
        return Ok(new { success = success, message = "Hủy đơn hàng và gửi yêu cầu hoàn tiền thành công." });
    }

    [Authorize]
    [HttpPost("{id}/confirm-receipt")]
    public async Task<IActionResult> ConfirmReceipt(Guid id, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var success = await _mediator.Send(new Application.Orders.Commands.ConfirmReceiptCommand(id, userId), ct);
        return Ok(new { success = success, message = "Xác nhận nhận hàng thành công. Cảm ơn bạn đã mua hàng!" });
    }
}
