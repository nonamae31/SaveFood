using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SaveFoodBackend.Controllers;

[Route("api/admin/finance")]
[ApiController]
// [Authorize(Roles = "Admin")]
public class AdminFinanceController : ControllerBase
{
    private readonly SaveFoodDbContext _context;

    public AdminFinanceController(SaveFoodDbContext context)
    {
        _context = context;
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<PaginatedList<WalletTransactionDTO>>> GetTransactions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.WalletTransactions
            .Include(t => t.StoreWallet)
            .ThenInclude(w => w.Store)
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        var dtos = items.Select(t => new WalletTransactionDTO
        {
            Id = t.Id,
            StoreWalletId = t.StoreWalletId,
            StoreName = t.StoreWallet.Store.Name,
            Amount = t.Amount,
            Type = t.Type,
            Status = t.Status,
            OrderId = t.OrderId,
            Description = t.Description,
            CreatedAt = t.CreatedAt
        }).ToList();

        return Ok(new PaginatedList<WalletTransactionDTO>(dtos, totalCount, pageNumber, pageSize));
    }

    [HttpGet("withdrawals")]
    public async Task<ActionResult<PaginatedList<WithdrawalRequestDTO>>> GetWithdrawals([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] byte? status = null)
    {
        var query = _context.WithdrawalRequests
            .Include(w => w.Store)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(w => w.Status == status.Value);
        }

        query = query.OrderByDescending(w => w.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        var dtos = items.Select(w => new WithdrawalRequestDTO
        {
            Id = w.Id,
            StoreId = w.StoreId,
            StoreName = w.Store.Name,
            Amount = w.Amount,
            Status = w.Status,
            BankName = w.BankName,
            BankAccountNumber = w.BankAccountNumber,
            BankAccountName = w.BankAccountName,
            AdminNote = w.AdminNote,
            CreatedAt = w.CreatedAt,
            ProcessedAt = w.ProcessedAt
        }).ToList();

        return Ok(new PaginatedList<WithdrawalRequestDTO>(dtos, totalCount, pageNumber, pageSize));
    }

    [HttpPut("withdrawals/{id}/process")]
    public async Task<ActionResult> ProcessWithdrawal(Guid id, [FromBody] ProcessFinanceRequestDTO request)
    {
        var withdrawal = await _context.WithdrawalRequests
            .Include(w => w.Store)
            .ThenInclude(s => s.StoreWallet)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (withdrawal == null) return NotFound("Withdrawal request not found.");
        if (withdrawal.Status != (byte)WithdrawalStatusEnum.Pending && withdrawal.Status != (byte)WithdrawalStatusEnum.Processing) 
            return BadRequest("Withdrawal request has already been processed.");

        var wallet = withdrawal.Store.StoreWallet;
        if (wallet == null) return BadRequest("Store wallet not found.");

        withdrawal.AdminNote = request.AdminNote;
        withdrawal.ProcessedAt = DateTime.UtcNow;

        if (request.IsApproved)
        {
            withdrawal.Status = (byte)WithdrawalStatusEnum.Paid;
            // The money was already deducted from AvailableBalance when request was created.
            // Create a completed WalletTransaction
            _context.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = wallet.Id,
                Amount = -withdrawal.Amount,
                Type = (byte)TransactionTypeEnum.Withdrawal,
                Status = (byte)TransactionStatusEnum.Completed,
                ReferenceId = withdrawal.Id,
                Description = $"Withdrawal Processed",
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            withdrawal.Status = (byte)WithdrawalStatusEnum.Rejected;
            // Refund the money back to AvailableBalance
            wallet.AvailableBalance += withdrawal.Amount;
            
            _context.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = wallet.Id,
                Amount = withdrawal.Amount,
                Type = (byte)TransactionTypeEnum.Withdrawal,
                Status = (byte)TransactionStatusEnum.Failed,
                ReferenceId = withdrawal.Id,
                Description = $"Withdrawal Rejected",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = request.IsApproved ? "Withdrawal paid successfully." : "Withdrawal rejected." });
    }

    [HttpGet("refunds")]
    public async Task<ActionResult<PaginatedList<RefundRequestDTO>>> GetRefunds([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] byte? status = null)
    {
        var query = _context.RefundRequests
            .Include(r => r.RequestedByNavigation)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        query = query.OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        var dtos = items.Select(r => new RefundRequestDTO
        {
            Id = r.Id,
            OrderId = r.OrderId,
            RequestedBy = r.RequestedBy,
            CustomerName = r.RequestedByNavigation.FullName,
            Amount = r.Amount,
            Reason = r.Reason,
            Status = r.Status,
            AdminNote = r.AdminNote,
            CustomerBankName = r.CustomerBankName,
            CustomerBankAccount = r.CustomerBankAccount,
            CustomerBankAccountName = r.CustomerBankAccountName,
            CreatedAt = r.CreatedAt,
            ProcessedAt = r.ProcessedAt
        }).ToList();

        return Ok(new PaginatedList<RefundRequestDTO>(dtos, totalCount, pageNumber, pageSize));
    }

    [HttpPut("refunds/{id}/process")]
    public async Task<ActionResult> ProcessRefund(Guid id, [FromBody] ProcessFinanceRequestDTO request)
    {
        var refund = await _context.RefundRequests
            .Include(r => r.Order)
            .ThenInclude(o => o.Store)
            .ThenInclude(s => s.StoreWallet)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (refund == null) return NotFound("Refund request not found.");
        if (refund.Status != (byte)RefundStatusEnum.Pending) 
            return BadRequest("Refund request has already been processed.");

        var wallet = refund.Order.Store.StoreWallet;
        if (wallet == null) return BadRequest("Store wallet not found.");

        refund.AdminNote = request.AdminNote;
        refund.ProcessedAt = DateTime.UtcNow;

        if (request.IsApproved)
        {
            if (wallet.PendingBalance < refund.Amount)
                return BadRequest("Insufficient Pending Balance to process refund.");

            refund.Status = (byte)RefundStatusEnum.Refunded;
            wallet.PendingBalance -= refund.Amount;

            _context.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                StoreWalletId = wallet.Id,
                Amount = -refund.Amount,
                Type = (byte)TransactionTypeEnum.Refund,
                Status = (byte)TransactionStatusEnum.Completed,
                OrderId = refund.OrderId,
                ReferenceId = refund.Id,
                Description = $"Refund to Customer",
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            refund.Status = (byte)RefundStatusEnum.Rejected;
            // No wallet changes needed if rejected (pending balance stays pending until order completes)
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = request.IsApproved ? "Refund completed successfully." : "Refund rejected." });
    }
}
