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
    private readonly MediatR.IMediator _mediator;

    public AdminFinanceController(IAdminFinanceService adminFinanceService, MediatR.IMediator mediator)
    {
        _adminFinanceService = adminFinanceService;
        _mediator = mediator;
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<PaginatedList<WalletTransactionDTO>>> GetTransactions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _adminFinanceService.GetTransactionsAsync(pageNumber, pageSize, search, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("customer-transactions")]
    public async Task<ActionResult<PaginatedList<CustomerWalletTransactionAdminDTO>>> GetCustomerTransactions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 15, [FromQuery] string? search = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _adminFinanceService.GetCustomerWalletTransactionsAsync(pageNumber, pageSize, search, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("withdrawals")]
    public async Task<ActionResult<PaginatedList<WithdrawalRequestDTO>>> GetWithdrawals([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] byte? status = null, [FromQuery] string? search = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _adminFinanceService.GetWithdrawalsAsync(pageNumber, pageSize, status, search, startDate, endDate);
        return Ok(result);
    }

    [HttpPut("withdrawals/{id}/process")]
    public async Task<ActionResult> ProcessWithdrawal(Guid id, [FromBody] ProcessFinanceRequestDTO request)
    {
        var adminIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(adminIdClaim) || !Guid.TryParse(adminIdClaim, out Guid adminId))
        {
            adminId = Guid.Empty; // fallback
        }

        var command = new SaveFoodBackend.Application.Features.Finance.Commands.ProcessWithdrawalCommand
        {
            RequestId = id,
            AdminId = adminId,
            IsApproved = request.IsApproved,
            AdminNote = request.AdminNote
        };
            
        try
        {
            var message = await _mediator.Send(command);
            return Ok(new { message });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found")) return NotFound(ex.Message);
            return BadRequest(ex.Message);
        }
    }

}
