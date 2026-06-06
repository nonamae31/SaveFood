using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Controllers;
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

    [HttpPost("withdraw")]
    public async Task<IActionResult> RequestWithdrawal([FromBody] SaveFoodBackend.DTOs.Customer.Wallets.CustomerWithdrawRequest request, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            await _walletService.RequestWithdrawalAsync(userId, request, ct);
            return OkResponse("Tạo yêu cầu rút tiền thành công.");
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
