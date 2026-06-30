using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Customer.Carts;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize] // Only logged in users have a cart
public class CartsController : ApiControllerBase
{
    private readonly ICartService _cartService;

    public CartsController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyCart(CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var items = await _cartService.GetMyCartAsync(userId, ct);
        return Ok(items);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartRequestDTO req, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var item = await _cartService.AddToCartAsync(userId, req, ct);
        return Ok(item);
    }

    [HttpPut("items/{id:guid}")]
    public async Task<IActionResult> UpdateCartItem(Guid id, [FromBody] UpdateCartItemRequestDTO req, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var item = await _cartService.UpdateCartItemAsync(userId, id, req, ct);
        return Ok(item);
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> RemoveFromCart(Guid id, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        await _cartService.RemoveFromCartAsync(userId, id, ct);
        return NoContent();
    }
}
