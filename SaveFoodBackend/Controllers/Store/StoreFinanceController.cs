using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace SaveFoodBackend.Controllers.Store;

[Route("api/store/finance")]
[ApiController]
[Authorize]
public class StoreFinanceController : ControllerBase
{
    private readonly IStoreFinanceService _storeFinanceService;
    private readonly SaveFoodDbContext _ctx;

    public StoreFinanceController(IStoreFinanceService storeFinanceService, SaveFoodDbContext ctx)
    {
        _storeFinanceService = storeFinanceService;
        _ctx = ctx;
    }

    private async Task<Guid> GetCurrentStoreIdAsync()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
        {
            throw new UnauthorizedAccessException("UserId not found in token.");
        }

        var storeStaff = await _ctx.StoreStaffs.FirstOrDefaultAsync(s => s.UserId == userId);
        if (storeStaff == null)
        {
            throw new UnauthorizedAccessException("Bạn không thuộc cửa hàng nào.");
        }

        return storeStaff.StoreId;
    }

    [HttpGet("wallet")]
    public async Task<ActionResult<StoreWalletDTO>> GetWallet()
    {
        try
        {
            var storeId = await GetCurrentStoreIdAsync();
            var wallet = await _storeFinanceService.GetStoreWalletAsync(storeId);
            if (wallet == null) return NotFound("Store wallet not found.");
            return Ok(wallet);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<PaginatedList<WalletTransactionListDTO>>> GetTransactions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var storeId = await GetCurrentStoreIdAsync();
            var result = await _storeFinanceService.GetTransactionsAsync(storeId, pageNumber, pageSize);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("withdrawals")]
    public async Task<ActionResult<PaginatedList<WithdrawalRequestListDTO>>> GetWithdrawals([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var storeId = await GetCurrentStoreIdAsync();
            var result = await _storeFinanceService.GetWithdrawalsAsync(storeId, pageNumber, pageSize);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [HttpPost("withdrawals")]
    public async Task<ActionResult> CreateWithdrawal([FromBody] CreateWithdrawalRequestDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var storeId = await GetCurrentStoreIdAsync();
            var message = await _storeFinanceService.CreateWithdrawalRequestAsync(storeId, dto);
            return Ok(new { message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
