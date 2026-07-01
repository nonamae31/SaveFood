using System;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;

namespace SaveFoodBackend.Controllers;

[Route("api/admin/audit")]
[ApiController]
[Authorize(Roles = "ADMIN,Admin")]
public class AdminAuditController : ControllerBase
{
    private readonly SaveFoodDbContext _ctx;

    public AdminAuditController(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    // GET: api/admin/audit/report?from=2026-01-01&to=2026-12-31
    [HttpGet("report")]
    public async Task<IActionResult> GetAuditReport(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var fromDate = from.HasValue 
            ? new DateTimeOffset(from.Value.Year, from.Value.Month, from.Value.Day, 0, 0, 0, TimeSpan.FromHours(7)).UtcDateTime 
            : DateTime.UtcNow.AddMonths(-3);
            
        var toDate = to.HasValue
            ? new DateTimeOffset(to.Value.Year, to.Value.Month, to.Value.Day, 23, 59, 59, 999, TimeSpan.FromHours(7)).UtcDateTime
            : DateTime.UtcNow.AddHours(7);

        // Luồng 1: Đơn hàng khách mua (Payment qua PayOS hoặc Wallet)
        var orderPayments = await _ctx.Payments
            .Include(p => p.Order)
                .ThenInclude(o => o.User)
            .Include(p => p.Order)
                .ThenInclude(o => o.Store)
            .Where(p => p.Status == 1 && p.PaidAt >= fromDate && p.PaidAt <= toDate && p.Order != null && p.Order.OrderStatus != SaveFoodBackend.Models.Enums.OrderStatusEnum.Cancelled)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync();

        var orderItems = orderPayments.Select(p => new AuditReportItemDTO
        {
            Date = DateTime.SpecifyKind(p.PaidAt ?? p.CreatedAt, DateTimeKind.Utc),
            Type = "Đơn hàng",
            CustomerName = p.Order?.User?.FullName ?? "Không rõ",
            CustomerEmail = p.Order?.User?.Email ?? "-",
            StoreName = p.Order?.Store?.Name ?? "-",
            OrderCode = p.Order?.OrderCode?.ToString() ?? "-",
            PayOsRef = p.PayOsReference ?? "-",
            PayerAccountNumber = p.PayerAccountNumber ?? "-",
            PayerName = p.PayerName ?? "-",
            PayerBankId = p.PayerBankId ?? "-",
            TotalAmount = p.Amount,
            PlatformRevenue = Math.Round(p.Amount * 0.05m, 0),
            Category = $"Commission 5%",
            PaymentMethod = p.PaymentMethod == 1 ? "PayOS" : "Ví SaveFood"
        }).ToList();

        // Luồng 2: Shop mua gói subscription
        var subscriptions = await _ctx.StoreSubscriptions
            .Include(s => s.Store)
                .ThenInclude(st => st.StoreStaffs)
                    .ThenInclude(ss => ss.User)
            .Include(s => s.Plan)
            .Where(s => s.Status == 1 && s.CreatedAt >= fromDate && s.CreatedAt <= toDate && s.OrderCode != null)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var subscriptionItems = subscriptions.Select(s =>
        {
            var owner = s.Store?.StoreStaffs?.FirstOrDefault(ss => ss.StaffRole == 2)?.User
                     ?? s.Store?.StoreStaffs?.FirstOrDefault()?.User;
            return new AuditReportItemDTO
            {
                Date = DateTime.SpecifyKind(s.CreatedAt, DateTimeKind.Utc),
                Type = "Subscription",
                CustomerName = owner?.FullName ?? s.Store?.Name ?? "Không rõ",
                CustomerEmail = owner?.Email ?? "-",
                StoreName = s.Store?.Name ?? "-",
                OrderCode = s.OrderCode?.ToString() ?? "-",
                PayOsRef = s.PayOsTransactionId ?? "-",
                PayerAccountNumber = s.PayerAccountNumber ?? "-",
                PayerName = s.PayerName ?? "-",
                PayerBankId = s.PayerBankId ?? "-",
                TotalAmount = s.Plan?.MonthlyPrice ?? 0,
                PlatformRevenue = s.Plan?.MonthlyPrice ?? 0, // 100% về platform
                Category = $"Gói {s.Plan?.Name ?? "?"}",
                PaymentMethod = "PayOS"
            };
        }).ToList();

        var allItems = orderItems.Concat(subscriptionItems)
            .OrderByDescending(x => x.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var totalCount = orderItems.Count + subscriptionItems.Count;

        return Ok(new
        {
            items = allItems,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            currentPage = page,
            summary = new
            {
                totalOrders = orderItems.Count,
                totalSubscriptions = subscriptionItems.Count,
                totalPlatformRevenue = orderItems.Sum(x => x.PlatformRevenue) + subscriptionItems.Sum(x => x.PlatformRevenue)
            }
        });
    }

    // GET: api/admin/audit/export-csv?from=2026-01-01&to=2026-12-31
    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var fromDate = from.HasValue 
            ? new DateTimeOffset(from.Value.Year, from.Value.Month, from.Value.Day, 0, 0, 0, TimeSpan.FromHours(7)).UtcDateTime 
            : DateTime.UtcNow.AddMonths(-3);
            
        var toDate = to.HasValue
            ? new DateTimeOffset(to.Value.Year, to.Value.Month, to.Value.Day, 23, 59, 59, 999, TimeSpan.FromHours(7)).UtcDateTime
            : DateTime.UtcNow.AddHours(7);

        // Luồng 1: Đơn hàng
        var orderPayments = await _ctx.Payments
            .Include(p => p.Order).ThenInclude(o => o.User)
            .Include(p => p.Order).ThenInclude(o => o.Store)
            .Where(p => p.Status == 1 && p.PaidAt >= fromDate && p.PaidAt <= toDate)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync();

        var orderRows = orderPayments.Select(p => new AuditReportItemDTO
        {
            Date = DateTime.SpecifyKind(p.PaidAt ?? p.CreatedAt, DateTimeKind.Utc),
            Type = "Đơn hàng",
            CustomerName = p.Order?.User?.FullName ?? "Không rõ",
            CustomerEmail = p.Order?.User?.Email ?? "-",
            StoreName = p.Order?.Store?.Name ?? "-",
            OrderCode = p.Order?.OrderCode?.ToString() ?? "-",
            PayOsRef = p.PayOsReference ?? "-",
            PayerAccountNumber = p.PayerAccountNumber ?? "-",
            PayerName = p.PayerName ?? "-",
            PayerBankId = p.PayerBankId ?? "-",
            TotalAmount = p.Amount,
            PlatformRevenue = Math.Round(p.Amount * 0.05m, 0),
            Category = "Commission 5%",
            PaymentMethod = p.PaymentMethod == 1 ? "PayOS" : "Ví SaveFood"
        });

        // Luồng 2: Subscription
        var subscriptions = await _ctx.StoreSubscriptions
            .Include(s => s.Store).ThenInclude(st => st.StoreStaffs).ThenInclude(ss => ss.User)
            .Include(s => s.Plan)
            .Where(s => s.Status == 1 && s.CreatedAt >= fromDate && s.CreatedAt <= toDate && s.OrderCode != null)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var subRows = subscriptions.Select(s =>
        {
            var owner = s.Store?.StoreStaffs?.FirstOrDefault(ss => ss.StaffRole == 2)?.User
                     ?? s.Store?.StoreStaffs?.FirstOrDefault()?.User;
            return new AuditReportItemDTO
            {
                Date = DateTime.SpecifyKind(s.CreatedAt, DateTimeKind.Utc),
                Type = "Subscription",
                CustomerName = owner?.FullName ?? s.Store?.Name ?? "Không rõ",
                CustomerEmail = owner?.Email ?? "-",
                StoreName = s.Store?.Name ?? "-",
                OrderCode = s.OrderCode?.ToString() ?? "-",
                PayOsRef = s.PayOsTransactionId ?? "-",
                PayerAccountNumber = s.PayerAccountNumber ?? "-",
                PayerName = s.PayerName ?? "-",
                PayerBankId = s.PayerBankId ?? "-",
                TotalAmount = s.Plan?.MonthlyPrice ?? 0,
                PlatformRevenue = s.Plan?.MonthlyPrice ?? 0,
                Category = $"Gói {s.Plan?.Name ?? "?"}",
                PaymentMethod = "PayOS"
            };
        });

        var allRows = orderRows.Concat(subRows).OrderByDescending(x => x.Date).ToList();

        // Build CSV with UTF-8 BOM (so Excel reads Vietnamese correctly)
        var sb = new StringBuilder();
        sb.AppendLine("Ngày,Loại,Tên khách/Shop,Email,Cửa hàng,Mã đơn,PayOS Reference,Số TK người chuyển,Tên chủ TK,Ngân hàng,Tổng tiền,Doanh thu nền tảng,Hạng mục,Phương thức TT");

        foreach (var row in allRows)
        {
            var date = TimeZoneInfo.ConvertTimeFromUtc(row.Date, TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"))
                                   .ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture);
            sb.AppendLine($"{date},{row.Type},\"{row.CustomerName}\",{row.CustomerEmail},{row.StoreName},{row.OrderCode},{row.PayOsRef},{row.PayerAccountNumber},\"{row.PayerName}\",{row.PayerBankId},{row.TotalAmount},{row.PlatformRevenue},{row.Category},{row.PaymentMethod}");
        }

        // UTF-8 BOM
        var preamble = Encoding.UTF8.GetPreamble();
        var csvBytes = preamble.Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();

        var fileName = $"savefood_audit_{fromDate:yyyyMMdd}_{toDate:yyyyMMdd}.csv";
        return File(csvBytes, "text/csv; charset=utf-8", fileName);
    }
}

public class AuditReportItemDTO
{
    public DateTime Date { get; set; }
    public string Type { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string CustomerEmail { get; set; } = "";
    public string StoreName { get; set; } = "";
    public string OrderCode { get; set; } = "";
    public string PayOsRef { get; set; } = "";
    public string PayerAccountNumber { get; set; } = "";
    public string PayerName { get; set; } = "";
    public string PayerBankId { get; set; } = "";
    public decimal TotalAmount { get; set; }
    public decimal PlatformRevenue { get; set; }
    public string Category { get; set; } = "";
    public string PaymentMethod { get; set; } = "";
}
