using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Utils;

namespace SaveFoodBackend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrdersController : ApiControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [Authorize]
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequestDTO req, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var result = await _orderService.CheckoutAsync(userId, req, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetMyOrders(CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var result = await _orderService.GetMyOrdersAsync(userId, ct);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var result = await _orderService.GetOrderByIdAsync(id, userId, ct);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Roles = "StoreOwner, StoreStaff")]
    [HttpPost("{id}/verify-pickup")]
    public async Task<IActionResult> VerifyPickup(Guid id, [FromBody] VerifyPickupRequestDTO req, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var success = await _orderService.VerifyPickupAsync(id, req.PickupCode, userId, ct);
            return Ok(new { success = success, message = "Xác nhận nhận hàng thành công." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
