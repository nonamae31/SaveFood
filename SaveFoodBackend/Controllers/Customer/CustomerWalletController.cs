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

    [HttpPost("topup")]
    public async Task<IActionResult> TopUpWallet([FromQuery] decimal amount, [FromServices] SaveFoodBackend.Data.SaveFoodDbContext ctx, CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var wallet = await ctx.CustomerWallets.FindAsync(new object[] { userId }, ct);
            if (wallet == null)
            {
                wallet = new SaveFoodBackend.Models.CustomerWallet
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Balance = amount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                ctx.CustomerWallets.Add(wallet);
            }
            else
            {
                wallet.Balance += amount;
                wallet.UpdatedAt = DateTime.UtcNow;
            }

            ctx.CustomerWalletTransactions.Add(new SaveFoodBackend.Models.CustomerWalletTransaction
            {
                Id = Guid.NewGuid(),
                CustomerWalletId = wallet.Id,
                Amount = amount,
                Type = 1, // Income/Topup
                Status = 1, // Completed
                Description = "Nạp tiền thử nghiệm"
            });

            await ctx.SaveChangesAsync(ct);
            return OkResponse(new { Message = "Nạp tiền thành công", NewBalance = wallet.Balance });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Có lỗi xảy ra", Error = ex.Message });
        }
    }
}
