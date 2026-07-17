using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Wallets;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Services;

public class CustomerWalletService : ICustomerWalletService
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IPayOSService _payOSService;
    private readonly IRedisService _redisService;
    private readonly string _frontendBaseUrl;

    private static readonly TimeSpan IdempotencyTtl = TimeSpan.FromMinutes(10);

    public CustomerWalletService(
        SaveFoodDbContext ctx,
        IPayOSService payOSService,
        IRedisService redisService,
        IConfiguration config)
    {
        _ctx = ctx;
        _payOSService = payOSService;
        _redisService = redisService;
        _frontendBaseUrl = config["Frontend:BaseUrl"]
            ?? throw new InvalidOperationException("Frontend:BaseUrl is not configured.");
    }

    // ─── GetMyWalletAsync ─────────────────────────────────────────────────────

    public async Task<CustomerWalletDTO> GetMyWalletAsync(Guid userId, CancellationToken ct = default)
    {
        var wallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);

        if (wallet == null)
        {
            // Auto create wallet if it doesn't exist
            wallet = new CustomerWallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _ctx.CustomerWallets.Add(wallet);
            await _ctx.SaveChangesAsync(ct);
        }

        return new CustomerWalletDTO
        {
            Id = wallet.Id,
            Balance = wallet.Balance,
            UpdatedAt = wallet.UpdatedAt
        };
    }

    // ─── GetMyTransactionsAsync ───────────────────────────────────────────────

    public async Task<List<CustomerWalletTransactionDTO>> GetMyTransactionsAsync(Guid userId, CancellationToken ct = default)
    {
        var wallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);

        if (wallet == null)
        {
            return new List<CustomerWalletTransactionDTO>();
        }

        var transactions = await _ctx.CustomerWalletTransactions
            .Include(t => t.Order)
            .Where(t => t.CustomerWalletId == wallet.Id)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return transactions.Select(t => new CustomerWalletTransactionDTO
        {
            Id = t.Id,
            Amount = t.Amount,
            Type = t.Type,
            Status = t.Status,
            Description = t.Description,
            CreatedAt = t.CreatedAt,
            OrderId = t.OrderId,
            OrderCode = t.Order?.OrderCode
        }).ToList();
    }

    // ─── CreateTopUpPaymentAsync ──────────────────────────────────────────────

    public async Task<string> CreateTopUpPaymentAsync(
        Guid userId, decimal amount, string idempotencyKey, CancellationToken ct = default)
    {
        var redisKey = $"idempotency:topup:{idempotencyKey}";

        // 1. Check Redis idempotency
        var existing = await _redisService.GetAsync(redisKey);
        if (existing != null)
        {
            if (existing.StartsWith("done:"))
                // Throw sentinel với checkoutUrl cũ để controller trả 409 + URL
                throw new InvalidOperationException($"IDEMPOTENCY:{existing["done:".Length..]}");
            // "processing" — đang xử lý
            throw new InvalidOperationException("IDEMPOTENCY_PROCESSING");
        }

        // 2. SET "processing" ngay lập tức (thu hẹp race window)
        await _redisService.SetAsync(redisKey, "processing", IdempotencyTtl);

        try
        {
            // 3. Validate
            if (amount < 10000 || amount > 50_000_000)
                throw new InvalidOperationException("Số tiền nạp phải từ 10,000đ đến 50,000,000đ.");

            // 4. GetOrCreate wallet
            var wallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);
            if (wallet == null)
            {
                wallet = new CustomerWallet
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Balance = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _ctx.CustomerWallets.Add(wallet);
                await _ctx.SaveChangesAsync(ct);
            }

            // 5. Retry loop: generate unique orderCode + INSERT pending tx
            CustomerWalletTransaction? pendingTx = null;
            long orderCode = 0;

            for (int attempt = 0; attempt < 3; attempt++)
            {
                var timeMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                // Jitter thay đổi theo attempt để tránh trùng khi retry
                var jitter = (long)((Math.Abs(userId.GetHashCode()) + attempt * 337) % 1000);
                orderCode = timeMs * 1000L + jitter;

                pendingTx = new CustomerWalletTransaction
                {
                    Id = Guid.NewGuid(),
                    CustomerWalletId = wallet.Id,
                    Amount = amount,
                    Type = 0,        // Deposit
                    Status = 0,      // Pending — webhook sẽ set = 1 khi PayOS confirm
                    PayOsOrderCode = orderCode,
                    Description = "Nạp tiền vào ví qua PayOS",
                    CreatedAt = DateTime.UtcNow
                };

                _ctx.CustomerWalletTransactions.Add(pendingTx);
                try
                {
                    await _ctx.SaveChangesAsync(ct);
                    break; // thành công → thoát loop
                }
                catch (DbUpdateException ex)
                    when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx
                          && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
                {
                    // orderCode trùng → detach và thử lại với jitter khác
                    _ctx.Entry(pendingTx).State = EntityState.Detached;
                    if (attempt == 2)
                        throw new InvalidOperationException(
                            "Không thể tạo mã giao dịch duy nhất. Vui lòng thử lại sau vài giây.");
                }
            }

            // 6. Gọi PayOS tạo payment link
            var returnUrl = $"{_frontendBaseUrl}/my-wallet?topupStatus=success&orderCode={orderCode}";
            var cancelUrl = $"{_frontendBaseUrl}/my-wallet?topupStatus=cancelled";

            var payOSResult = await _payOSService.CreatePaymentLink(
                orderCode,
                amount,
                "Nap tien vi SaveFood", // Rút gọn dưới 25 ký tự theo chuẩn PayOS
                returnUrlOverride: returnUrl,
                cancelUrlOverride: cancelUrl
            );

            var checkoutUrl = payOSResult.CheckoutUrl
                ?? throw new InvalidOperationException("PayOS không trả về checkout URL.");

            // 7. Cập nhật Redis: "done:{checkoutUrl}" để trả lại nếu request trùng
            await _redisService.SetAsync(redisKey, $"done:{checkoutUrl}", IdempotencyTtl);

            return checkoutUrl;
        }
        catch
        {
            // Nếu xử lý thất bại, xóa "processing" để FE có thể thử lại
            await _redisService.DeleteAsync(redisKey);
            throw;
        }
    }

    // ─── RequestWithdrawalAsync ───────────────────────────────────────────────

    public async Task RequestWithdrawalAsync(
        Guid userId, CustomerWithdrawRequest request, string idempotencyKey, CancellationToken ct = default)
    {
        var redisKey = $"idempotency:withdraw:{idempotencyKey}";

        // 1. Check Redis idempotency
        var existing = await _redisService.GetAsync(redisKey);
        if (existing != null)
            throw new InvalidOperationException("IDEMPOTENCY_DUPLICATE");

        // 2. SET "processing" ngay lập tức
        await _redisService.SetAsync(redisKey, "processing", IdempotencyTtl);

        try
        {
            // 3. Validate
            if (request.Amount <= 0)
                throw new InvalidOperationException("Số tiền rút phải lớn hơn 0đ.");

            var wallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == userId, ct);
            if (wallet == null)
            {
                wallet = new CustomerWallet
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Balance = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _ctx.CustomerWallets.Add(wallet);
            }

            if (wallet.Balance < request.Amount)
                throw new InvalidOperationException("Số dư không đủ để thực hiện giao dịch.");

            // 4. Trừ số dư ngay
            wallet.Balance -= request.Amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            var withdrawalRequest = new WithdrawalRequest
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Amount = request.Amount,
                Status = 0, // Pending
                BankName = request.BankName,
                BankAccountNumber = request.AccountNumber,
                BankAccountName = request.AccountName,
                IdempotencyKey = idempotencyKey, // DB unique constraint làm backstop
                CreatedAt = DateTime.UtcNow
            };

            var tx = new CustomerWalletTransaction
            {
                Id = Guid.NewGuid(),
                CustomerWalletId = wallet.Id,
                Amount = request.Amount,
                Type = 1,   // Withdrawal
                Status = 0, // Pending
                ReferenceId = withdrawalRequest.Id,
                CreatedAt = DateTime.UtcNow,
                Description = $"Rút tiền về {request.BankName} - STK: {request.AccountNumber} - Chủ thẻ: {request.AccountName}"
            };

            _ctx.WithdrawalRequests.Add(withdrawalRequest);
            _ctx.CustomerWalletTransactions.Add(tx);

            try
            {
                await _ctx.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx
                      && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                // DB unique constraint bắt được race condition vượt qua Redis
                throw new InvalidOperationException("IDEMPOTENCY_DUPLICATE");
            }

            // 5. Cập nhật Redis: "done"
            await _redisService.SetAsync(redisKey, "done", IdempotencyTtl);
        }
        catch
        {
            await _redisService.DeleteAsync(redisKey);
            throw;
        }
    }
}
