using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PayOS.Models.Webhooks;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Services;

namespace SaveFoodBackend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentsController : ControllerBase
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IPayOSService _payOSService;

    public PaymentsController(SaveFoodDbContext ctx, IPayOSService payOSService)
    {
        _ctx = ctx;
        _payOSService = payOSService;
    }

    [HttpPost("payos-webhook")]
    public async Task<IActionResult> PayOSWebhook([FromBody] Webhook body)
    {
        try
        {
            // Verify webhook signature (will throw if invalid)
            WebhookData data = _payOSService.VerifyPaymentWebhookData(body);
            
            if (data.Code == "00")
            {
                var orderCode = data.OrderCode;
                var order = await _ctx.Orders.Include(o => o.Payment)
                                             .FirstOrDefaultAsync(o => o.OrderCode == orderCode);
                
                if (order != null)
                {
                    if (order.Payment != null && order.Payment.Status == 0) // Pending
                    {
                        order.Payment.Status = 1; // Paid
                        order.Payment.PaidAt = DateTime.UtcNow;
                        order.OrderStatus = 1; // Paid / Confirmed
                        
                        await _ctx.SaveChangesAsync();
                    }
                }
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Webhook Error: {ex.Message}");
            return Ok(new { success = false }); // PayOS expects 200 OK anyway to not retry infinitely unless it's a server error.
        }
    }

    [HttpGet("verify/{orderId}")]
    public async Task<IActionResult> VerifyPayment(Guid orderId, [FromServices] Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        try
        {
            var order = await _ctx.Orders.Include(o => o.Payment)
                                         .FirstOrDefaultAsync(o => o.Id == orderId);
            
            if (order != null && order.Payment != null && order.Payment.Status == 0 && order.OrderCode.HasValue)
            {
                var payOSClient = new PayOS.PayOSClient(
                    new PayOS.PayOSOptions
                    {
                        ClientId = configuration["PayOS:ClientId"],
                        ApiKey = configuration["PayOS:ApiKey"],
                        ChecksumKey = configuration["PayOS:ChecksumKey"]
                    }
                );
                
                var payOSInfo = await payOSClient.PaymentRequests.GetAsync(order.OrderCode.Value);
                if (payOSInfo.Status.ToString().ToUpper() == "PAID")
                {
                    order.Payment.Status = 1; // Paid
                    order.Payment.PaidAt = DateTime.UtcNow;
                    order.OrderStatus = 1; // Paid / Confirmed
                    await _ctx.SaveChangesAsync();
                }
            }
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
