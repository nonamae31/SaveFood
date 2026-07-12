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
using IUnitOfWork = SaveFoodBackend.Interfaces.Repositories.IUnitOfWork;
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
    private readonly INotificationService _notificationService;

    public PaymentsController(
        SaveFoodDbContext ctx, 
        IPayOSService payOSService, 
        IUnitOfWork uow, 
        IOptions<PlatformConfig> platformConfig,
        INotificationService notificationService)
    {
        _ctx = ctx;
        _payOSService = payOSService;
        _uow = uow;
        _platformConfig = platformConfig.Value;
        _notificationService = notificationService;
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
                
                await _uow.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                try
                {
                    var orders = await _ctx.Orders.Include(o => o.Payment)
                                                 .Where(o => o.OrderCode == orderCode)
                                                 .ToListAsync();
                    
                    if (orders.Any())
                    {
                        foreach (var order in orders)
                        {
                            // Idempotency Check (Race condition safe due to Serializable IsolationLevel)
                            if (order.Payment != null && order.Payment.Status == 0) // Pending
                            {
                                order.OrderStatus = SaveFoodBackend.Models.Enums.OrderStatusEnum.Pending; // Wait for store confirmation
                                order.Payment.Status = 1; // Paid
                                order.Payment.PaidAt = DateTime.UtcNow;
                                order.ReservationExpiresAt = null; // Clear payment timer

                                if (order.VoucherDiscount > 0)
                                {
                                    var fundId = await _ctx.CustomerVoucherFunds.Where(v => v.CustomerId == order.UserId).Select(v => v.Id).FirstOrDefaultAsync();
                                    if (fundId != Guid.Empty)
                                    {
                                        await _ctx.CustomerVoucherFunds
                                            .Where(v => v.Id == fundId)
                                            .ExecuteUpdateAsync(s => s
                                                .SetProperty(v => v.AccumulatedBalance, v => v.AccumulatedBalance - order.VoucherDiscount)
                                                .SetProperty(v => v.ReservedAmount, v => v.ReservedAmount - order.VoucherDiscount));

                                        _ctx.CustomerVoucherTransactions.Add(new SaveFoodBackend.Models.CustomerVoucherTransaction
                                        {
                                            Id = Guid.NewGuid(),
                                            CustomerVoucherFundId = fundId,
                                            OrderId = order.Id,
                                            Amount = -order.VoucherDiscount,
                                            OrderTotal = order.TotalAmount,
                                            Type = 2, // Used
                                            CreatedAt = DateTime.UtcNow
                                        });
                                    }
                                }

                                // --- AUDIT TRAIL: Save PayOS evidence ---
                                order.Payment.PayOsReference = data.Reference;
                                order.Payment.PayerAccountNumber = data.CounterAccountNumber;
                                order.Payment.PayerName = data.CounterAccountName;
                                order.Payment.PayerBankId = data.CounterAccountBankId;

                                var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId);
                                if (storeWallet == null)
                                {
                                    storeWallet = new SaveFoodBackend.Models.StoreWallet
                                    {
                                        Id = Guid.NewGuid(),
                                        StoreId = order.StoreId,
                                        AvailableBalance = 0,
                                        PendingBalance = 0,
                                        UpdatedAt = DateTime.UtcNow
                                    };
                                    _ctx.StoreWallets.Add(storeWallet);
                                }
                                decimal platformFee = order.TotalAmount * _platformConfig.AdminFeePercentage;
                                storeWallet.PendingBalance += (order.TotalAmount - platformFee);

                                // --- AUDIT TRAIL: Notify Store ---
                                var staffIds = await _ctx.StoreStaffs.Where(s => s.StoreId == order.StoreId).Select(s => s.UserId).ToListAsync();
                                foreach (var uid in staffIds.Distinct())
                                {
                                    await _notificationService.SendAsync(
                                        userId: uid,
                                        title: "Đơn hàng mới",
                                        body: $"Có đơn hàng mới ({order.OrderCode}) vừa được thanh toán. Vui lòng kiểm tra và chuẩn bị món!",
                                        type: "NEW_ORDER",
                                        referenceId: order.Id
                                    );
                                }
                            }
                        }
                        await _uow.SaveChangesAsync();
                    }
                    else
                    {
                        var subscription = await _ctx.StoreSubscriptions.FirstOrDefaultAsync(s => s.OrderCode == orderCode);
                        if (subscription != null && subscription.Status == 3)
                        {
                            subscription.Status = 0; // Active

                            // --- AUDIT TRAIL: Save PayOS evidence ---
                            subscription.PayOsTransactionId = data.Reference;
                            subscription.PayerAccountNumber = data.CounterAccountNumber;
                            subscription.PayerName = data.CounterAccountName;
                            subscription.PayerBankId = data.CounterAccountBankId;
                            
                            // We must cancel any other active subscriptions for this store to prevent overlap
                            var activeSubs = await _ctx.StoreSubscriptions
                                                       .Where(s => s.StoreId == subscription.StoreId && s.Status == 1 && s.Id != subscription.Id)
                                                       .ToListAsync();
                            foreach(var sub in activeSubs)
                            {
                                sub.Status = 2; // Cancelled/Expired
                            }

                            await _uow.SaveChangesAsync();
                        }
                        else
                        {
                            // ─── Nhánh 3: Wallet Top-up ──────────────────────────────────────────────
                            // Nằm trong Serializable transaction → FirstOrDefaultAsync + Status check
                            // là idempotency guard chống double-credit khi PayOS retry webhook.
                            var topUpTx = await _ctx.CustomerWalletTransactions
                                .Include(t => t.CustomerWallet)
                                .FirstOrDefaultAsync(t =>
                                    t.PayOsOrderCode == orderCode &&
                                    t.Type == 0 &&    // Deposit
                                    (t.Status == 0 || t.Status == 2));   // Allow PENDING or CANCELLED (if user paid after clicking cancel)

                            if (topUpTx != null)
                            {
                                topUpTx.CustomerWallet.Balance += topUpTx.Amount;
                                topUpTx.CustomerWallet.UpdatedAt = DateTime.UtcNow;
                                topUpTx.Status = 1; // Completed

                                await _uow.SaveChangesAsync();

                                // Notify user
                                await _notificationService.SendAsync(
                                    userId: topUpTx.CustomerWallet.UserId,
                                    title: "Nạp tiền thành công",
                                    body: $"Ví của bạn đã được nạp {topUpTx.Amount:N0}đ.",
                                    type: "WALLET_TOPUP",
                                    referenceId: topUpTx.Id
                                );
                            }
                            else
                            {
                                Console.WriteLine($"[PayOS Webhook] Unknown orderCode: {orderCode} — không khớp Order, Subscription, hay TopUp.");
                            }
                        }
                    }


                    await _uow.CommitTransactionAsync();
                }
                catch
                {
                    await _uow.RollbackTransactionAsync();
                    throw;
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
            
            if (order != null && order.Payment != null)
            {
                if (order.Payment.Status == 1)
                {
                    return Ok(new { success = true, message = "Thanh toán đã được xác nhận." });
                }

                if (order.Payment.Status == 0 && order.OrderCode.HasValue)
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
                            var allOrders = await _ctx.Orders.Include(o => o.Payment)
                                                 .Where(o => o.OrderCode == order.OrderCode)
                                                 .ToListAsync();
                            
                            foreach (var o in allOrders)
                            {
                                if (o.Payment != null && o.Payment.Status == 0)
                                {
                                    o.OrderStatus = SaveFoodBackend.Models.Enums.OrderStatusEnum.Pending; // Wait for store confirmation
                                    o.Payment.Status = 1;
                                    o.Payment.PaidAt = DateTime.UtcNow;
                                    o.ReservationExpiresAt = null; // Clear payment timer

                                    // Voucher Logic
                                    if (o.VoucherDiscount > 0)
                                    {
                                        var fundId = await _ctx.CustomerVoucherFunds.Where(v => v.CustomerId == o.UserId).Select(v => v.Id).FirstOrDefaultAsync();
                                        if (fundId != Guid.Empty)
                                        {
                                            await _ctx.CustomerVoucherFunds
                                                .Where(v => v.Id == fundId)
                                                .ExecuteUpdateAsync(s => s
                                                    .SetProperty(v => v.AccumulatedBalance, v => v.AccumulatedBalance - o.VoucherDiscount)
                                                    .SetProperty(v => v.ReservedAmount, v => v.ReservedAmount - o.VoucherDiscount));

                                            _ctx.CustomerVoucherTransactions.Add(new SaveFoodBackend.Models.CustomerVoucherTransaction
                                            {
                                                Id = Guid.NewGuid(),
                                                CustomerVoucherFundId = fundId,
                                                OrderId = o.Id,
                                                Amount = -o.VoucherDiscount,
                                                OrderTotal = o.TotalAmount,
                                                Type = 2, // Used
                                                CreatedAt = DateTime.UtcNow
                                            });
                                        }
                                    }
                                    
                                    // --- AUDIT TRAIL: Save PayOS evidence ---
                                    var tx = payOSInfo.Transactions?.FirstOrDefault();
                                    if (tx != null)
                                    {
                                        o.Payment.PayOsReference = tx.Reference;
                                        o.Payment.PayerAccountNumber = tx.CounterAccountNumber;
                                        o.Payment.PayerName = tx.CounterAccountName;
                                        o.Payment.PayerBankId = tx.CounterAccountBankId;
                                    }
                                    
                                    var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == o.StoreId);
                                    if (storeWallet == null)
                                    {
                                        storeWallet = new SaveFoodBackend.Models.StoreWallet
                                        {
                                            Id = Guid.NewGuid(),
                                            StoreId = o.StoreId,
                                            AvailableBalance = 0,
                                            PendingBalance = 0,
                                            UpdatedAt = DateTime.UtcNow
                                        };
                                        _ctx.StoreWallets.Add(storeWallet);
                                    }
                                    decimal platformFee = o.TotalAmount * _platformConfig.AdminFeePercentage;
                                    storeWallet.PendingBalance += (o.TotalAmount - platformFee);

                                    // --- AUDIT TRAIL: Notify Store ---
                                    var staffIds = await _ctx.StoreStaffs.Where(s => s.StoreId == o.StoreId).Select(s => s.UserId).ToListAsync();
                                    foreach (var uid in staffIds.Distinct())
                                    {
                                        await _notificationService.SendAsync(
                                            userId: uid,
                                            title: "Đơn hàng mới",
                                            body: $"Có đơn hàng mới ({o.OrderCode}) vừa được thanh toán. Vui lòng kiểm tra và chuẩn bị món!",
                                            type: "NEW_ORDER",
                                            referenceId: o.Id
                                        );
                                    }
                                }
                            }
                            await _ctx.SaveChangesAsync();
                            return Ok(new { success = true });
                        }
                        
                        return Ok(new { success = false, status = "UNKNOWN" });
                    }
                    catch (Exception ex)
                    {
                        return Ok(new { success = false, message = "Lỗi kết nối đến cổng thanh toán PayOS", error = ex.Message });
                    }
                }
            }
            else
            {
                // check if it's a CustomerWalletTransaction (top-up)
                var topUpTx = await _ctx.CustomerWalletTransactions
                    .Include(t => t.CustomerWallet)
                    .FirstOrDefaultAsync(t => (isGuid && t.Id == parsedGuid) || (isLong && t.PayOsOrderCode == parsedLong));
                
                if (topUpTx != null && topUpTx.Type == 0) // Deposit
                {
                    if (topUpTx.Status == 1) return Ok(new { success = true, message = "Giao dịch đã hoàn tất." });
                    
                    if (topUpTx.Status == 0 && topUpTx.PayOsOrderCode.HasValue)
                    {
                        try 
                        {
                            var payOSInfo = await payOSClient.PaymentRequests.GetAsync(topUpTx.PayOsOrderCode.Value);
                            if (payOSInfo.Status.ToString().ToUpper() == "PAID")
                            {
                                await _uow.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                                try
                                {
                                    // Re-fetch inside lock to ensure it hasn't been processed by webhook
                                    var lockedTx = await _ctx.CustomerWalletTransactions
                                        .Include(t => t.CustomerWallet)
                                        .FirstOrDefaultAsync(t => t.Id == topUpTx.Id && (t.Status == 0 || t.Status == 2));
                                        
                                    if (lockedTx != null)
                                    {
                                        lockedTx.CustomerWallet.Balance += lockedTx.Amount;
                                        lockedTx.CustomerWallet.UpdatedAt = DateTime.UtcNow;
                                        lockedTx.Status = 1;

                                        await _uow.SaveChangesAsync();

                                        await _notificationService.SendAsync(
                                            userId: lockedTx.CustomerWallet.UserId,
                                            title: "Nạp tiền thành công",
                                            body: $"Ví của bạn đã được nạp {lockedTx.Amount:N0}đ.",
                                            type: "WALLET_TOPUP",
                                            referenceId: lockedTx.Id
                                        );
                                    }
                                    
                                    await _uow.CommitTransactionAsync();
                                }
                                catch
                                {
                                    await _uow.RollbackTransactionAsync();
                                    throw;
                                }

                                return Ok(new { success = true });
                            }
                            else if (payOSInfo.Status.ToString().ToUpper() == "CANCELLED")
                            {
                                topUpTx.Status = 2; // Failed / Cancelled
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
                else
                {
                    // check if it's a subscription (orderId could be subscriptionId)
                    var subscription = await _ctx.StoreSubscriptions.FirstOrDefaultAsync(s => (isGuid && s.Id == parsedGuid) || (isLong && s.OrderCode == parsedLong));
                    if (subscription != null)
                    {
                        if (subscription.Status == 1)
                        {
                            return Ok(new { success = true, message = "Thanh toán gói đăng ký đã hoàn tất." });
                        }

                        if (subscription.Status == 0 && subscription.OrderCode.HasValue)
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
                }
            }

            return Ok(new { success = false, message = "Không tìm thấy giao dịch hoặc giao dịch đã hoàn tất/hủy." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("cancel-topup/{orderCode}")]
    public async Task<IActionResult> CancelTopup(long orderCode)
    {
        try
        {
            var topUpTx = await _ctx.CustomerWalletTransactions.FirstOrDefaultAsync(t => t.PayOsOrderCode == orderCode && t.Type == 0);
            if (topUpTx != null && topUpTx.Status == 0)
            {
                topUpTx.Status = 2; // Cancelled
                await _ctx.SaveChangesAsync();
                return Ok(new { success = true });
            }
            return Ok(new { success = false, message = "Transaction not found or already processed" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
