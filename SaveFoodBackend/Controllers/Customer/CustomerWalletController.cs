using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Controllers;
using SaveFoodBackend.DTOs.Customer.Wallets;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers.Customer;

[ApiController]
[Route("api/customer/wallet")]
[Authorize]
public class CustomerWalletController : ApiControllerBase
{
    private readonly ICustomerWalletService _walletService;

    public CustomerWalletController(ICustomerWalletService walletService)
    {
        _walletService = walletService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyWallet(CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var wallet = await _walletService.GetMyWalletAsync(userId, ct);
            return Ok(wallet);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetMyTransactions(CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var transactions = await _walletService.GetMyTransactionsAsync(userId, ct);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Có lỗi xảy ra", Error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo PayOS payment link để nạp tiền vào ví.
    /// Yêu cầu header Idempotency-Key (UUID) để chống double-submit.
    /// </summary>
    [HttpPost("top-up")]
    public async Task<IActionResult> TopUp(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        [FromBody] TopUpRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return BadRequestResponse("Header 'Idempotency-Key' là bắt buộc.");

        try
        {
            var userId = GetRequiredUserId();
            var checkoutUrl = await _walletService.CreateTopUpPaymentAsync(userId, request.Amount, idempotencyKey, ct);
            return OkResponse(new TopUpResponse { CheckoutUrl = checkoutUrl }, "Tạo link thanh toán thành công.");
        }
        catch (InvalidOperationException ex) when (ex.Message.StartsWith("IDEMPOTENCY:"))
        {
            // Trả lại checkoutUrl cũ kèm 409 — FE redirect luôn
            var oldUrl = ex.Message["IDEMPOTENCY:".Length..];
            return Conflict(new { checkoutUrl = oldUrl, message = "Request này đã được xử lý trước đó." });
        }
        catch (InvalidOperationException ex) when (ex.Message == "IDEMPOTENCY_PROCESSING")
        {
            return Conflict(new { message = "Yêu cầu đang được xử lý, vui lòng đợi." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Có lỗi xảy ra khi tạo link thanh toán.", Error = ex.Message });
        }
    }

    /// <summary>
    /// Rút tiền về ngân hàng.
    /// Yêu cầu header Idempotency-Key (UUID) để chống double-submit.
    /// </summary>
    [HttpPost("withdraw")]
    public async Task<IActionResult> RequestWithdrawal(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        [FromBody] CustomerWithdrawRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return BadRequestResponse("Header 'Idempotency-Key' là bắt buộc.");

        try
        {
            var userId = GetRequiredUserId();
            await _walletService.RequestWithdrawalAsync(userId, request, idempotencyKey, ct);
            return OkResponse("Tạo yêu cầu rút tiền thành công.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "IDEMPOTENCY_DUPLICATE")
        {
            return Conflict(new { message = "Yêu cầu rút tiền này đã được gửi trước đó." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Có lỗi xảy ra", Error = ex.Message });
        }
    }
}
