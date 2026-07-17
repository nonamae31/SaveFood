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

    [Authorize]
    [HttpPost("reserve")]
    public async Task<IActionResult> Reserve(
        [FromHeader(Name = "Idempotency-Key")] string idempotencyKey,
        [FromBody] SaveFoodBackend.DTOs.ReserveOrderRequest req,
        [FromServices] ICheckoutReservationService reservationService,
        CancellationToken ct)
    {
        if (string.IsNullOrEmpty(idempotencyKey))
        {
            return BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Status = 400,
                Title = "Missing Idempotency-Key",
                Detail = "Idempotency-Key header is required"
            });
        }

        var userId = GetRequiredUserId();
        try
        {
            var result = await reservationService.ReserveAsync(userId, req, idempotencyKey, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex) when (ex.Message == "Duplicate request")
        {
            return Conflict(new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Status = 409,
                Title = "Conflict",
                Detail = "Duplicate request"
            });
        }
        catch (InvalidOperationException ex) when (ex.Message == "Sản phẩm đã hết hoặc không đủ số lượng")
        {
            return BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Status = 400,
                Title = "Out of stock",
                Detail = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Status = 400,
                Title = "Invalid request",
                Detail = ex.Message
            });
        }
    }

    /// <summary>
    /// Kiểm tra hàng còn không trước khi chuyển sang trang thanh toán.
    /// Gọi ngay khi khách bấm "Mua hàng ngay" ở CartPage.
    /// </summary>
    [Authorize]
    [HttpPost("check-availability")]
    public async Task<IActionResult> CheckAvailability([FromBody] List<Guid> cartItemIds, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var result = await _mediator.Send(
            new Application.Orders.Queries.CheckCartAvailabilityQuery(userId, cartItemIds), ct);
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

    [Authorize(Roles = "STORE,STORE_OWNER,Store,StoreStaff")]
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

    [Authorize]
    [HttpPost("{id}/repurchase")]
    public async Task<IActionResult> Repurchase(Guid id, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var success = await _mediator.Send(new Application.Orders.Commands.RepurchaseCommand(id, userId), ct);
        return Ok(new { success = success, message = "Đã thêm các sản phẩm còn bán vào giỏ hàng." });
    }
}
