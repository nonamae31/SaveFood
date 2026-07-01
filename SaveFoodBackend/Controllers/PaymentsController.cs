using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PayOS.Models.Webhooks;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models.Config;
using SaveFoodBackend.Services;

namespace SaveFoodBackend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentsController : ControllerBase
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IPayOSService _payOSService;
    private readonly IUnitOfWork _uow;
    private readonly PlatformConfig _platformConfig;
    private readonly IOrderService _orderService;

    public PaymentsController(
        SaveFoodDbContext ctx, 
        IPayOSService payOSService, 
        IUnitOfWork uow, 
        IOptions<PlatformConfig> platformConfig,
        IOrderService orderService)
    {
        _ctx = ctx;
        _payOSService = payOSService;
        _uow = uow;
        _platformConfig = platformConfig.Value;
        _orderService = orderService;
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
                await _orderService.HandleSuccessfulPayment(data.OrderCode, data);
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Webhook Error: {ex.Message}");
            return Ok(new { success = false }); // PayOS expects 200 OK anyway to not retry infinitely unless it's a server error.
        }
    }

    [HttpGet("verify/{orderIdOrCode}")]
    public async Task<IActionResult> VerifyPayment(string orderIdOrCode, [FromServices] Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        try
        {
            var payOSClient = new PayOS.PayOSClient(
                new PayOS.PayOSOptions
                {
                    ClientId = configuration["PayOS:ClientId"],
                    ApiKey = configuration["PayOS:ApiKey"],
                    ChecksumKey = configuration["PayOS:ChecksumKey"]
                }
            );

            bool isGuid = Guid.TryParse(orderIdOrCode, out Guid parsedGuid);
            bool isLong = long.TryParse(orderIdOrCode, out long parsedLong);

            var order = await _ctx.Orders.Include(o => o.Payment)
                                         .FirstOrDefaultAsync(o => (isGuid && o.Id == parsedGuid) || (isLong && o.OrderCode == parsedLong));
            
            if (order != null && order.Payment != null && order.Payment.Status == 0 && order.OrderCode.HasValue)
            {
                try
                {
                    var payOSInfo = await payOSClient.PaymentRequests.GetAsync(order.OrderCode.Value);
                    
                    if (payOSInfo.Status.ToString().ToUpper() == "CANCELLED")
                    {
                        order.Payment.Status = 2; // Failed / Cancelled
                        await _ctx.SaveChangesAsync();
                        return Ok(new { success = false, message = "Thanh toán đã bị hủy bởi người dùng.", orderId = order.Id });
                    }

                    if (payOSInfo.Status.ToString().ToUpper() == "PAID")
                    {
                        var tx = payOSInfo.Transactions?.FirstOrDefault();
                        await _orderService.ProcessPaymentSuccessAsync(
                            (long)order.OrderCode,
                            tx?.Reference ?? "",
                            tx?.CounterAccountNumber ?? "",
                            tx?.CounterAccountName ?? "",
                            tx?.CounterAccountBankId ?? ""
                        );
                        return Ok(new { success = true });
                    }
                }
                catch (Exception ex)
                {
                    return Ok(new { success = false, message = "Lỗi kết nối đến cổng thanh toán PayOS", error = ex.Message });
                }
                return Ok(new { success = false, status = "UNKNOWN" });
            }
            else if (order == null)
            {
                // check if it's a subscription (orderId could be subscriptionId)
                var subscription = await _ctx.StoreSubscriptions.FirstOrDefaultAsync(s => (isGuid && s.Id == parsedGuid) || (isLong && s.OrderCode == parsedLong));
                if (subscription != null && subscription.Status == 0 && subscription.OrderCode.HasValue)
                {
                    try
                    {
                        var payOSInfo = await payOSClient.PaymentRequests.GetAsync(subscription.OrderCode.Value);

                        if (payOSInfo.Status.ToString().ToUpper() == "PAID")
                        {
                            subscription.Status = 1; // Active
                            
                            // --- AUDIT TRAIL: Save PayOS evidence ---
                            var tx = payOSInfo.Transactions?.FirstOrDefault();
                            if (tx != null)
                            {
                                subscription.PayOsTransactionId = tx.Reference;
                                subscription.PayerAccountNumber = tx.CounterAccountNumber;
                                subscription.PayerName = tx.CounterAccountName;
                                subscription.PayerBankId = tx.CounterAccountBankId;
                            }

                            var activeSubs = await _ctx.StoreSubscriptions
                                                       .Where(s => s.StoreId == subscription.StoreId && s.Status == 1 && s.Id != subscription.Id)
                                                       .ToListAsync();
                            foreach(var sub in activeSubs)
                            {
                                sub.Status = 2; // Cancelled/Expired
                            }
                            await _ctx.SaveChangesAsync();
                            return Ok(new { success = true });
                        }
                        else if (payOSInfo.Status.ToString().ToUpper() == "CANCELLED")
                        {
                            subscription.Status = 2; // Cancelled
                            await _ctx.SaveChangesAsync();
                            return Ok(new { success = false, status = "CANCELLED" });
                        }

                        return Ok(new { success = false, status = payOSInfo.Status.ToString() });
                    }
                    catch (Exception ex)
                    {
                        return Ok(new { success = false, message = "Lỗi kết nối đến cổng thanh toán PayOS", error = ex.Message });
                    }
                }
            }

            return Ok(new { success = false, message = "Không tìm thấy giao dịch hoặc giao dịch đã hoàn tất." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
