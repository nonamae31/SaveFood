using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Common;
using System;
using System.Threading.Tasks;

namespace SaveFoodBackend.Controllers;

[Route("api/admin/finance")]
[ApiController]
[Authorize(Roles = "ADMIN,Admin")]
public class AdminFinanceController : ControllerBase
{
    private readonly IAdminFinanceService _adminFinanceService;

    public AdminFinanceController(IAdminFinanceService adminFinanceService)
    {
        _adminFinanceService = adminFinanceService;
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<PaginatedList<WalletTransactionDTO>>> GetTransactions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _adminFinanceService.GetTransactionsAsync(pageNumber, pageSize);
        return Ok(result);
    }

    [HttpGet("withdrawals")]
    public async Task<ActionResult<PaginatedList<WithdrawalRequestDTO>>> GetWithdrawals([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] byte? status = null)
    {
        var result = await _adminFinanceService.GetWithdrawalsAsync(pageNumber, pageSize, status);
        return Ok(result);
    }

    [HttpPut("withdrawals/{id}/process")]
    public async Task<ActionResult> ProcessWithdrawal(Guid id, [FromBody] ProcessFinanceRequestDTO request)
    {
        try
        {
            var message = await _adminFinanceService.ProcessWithdrawalAsync(id, request);
            return Ok(new { message });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found")) return NotFound(ex.Message);
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("refunds")]
    public async Task<ActionResult<PaginatedList<RefundRequestDTO>>> GetRefunds([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] byte? status = null)
    {
        var result = await _adminFinanceService.GetRefundsAsync(pageNumber, pageSize, status);
        return Ok(result);
    }

    [HttpPut("refunds/{id}/process")]
    public async Task<ActionResult> ProcessRefund(Guid id, [FromBody] ProcessFinanceRequestDTO request)
    {
        try
        {
            var message = await _adminFinanceService.ProcessRefundAsync(id, request);
            return Ok(new { message });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found")) return NotFound(ex.Message);
            return BadRequest(ex.Message);
        }
    }
}
