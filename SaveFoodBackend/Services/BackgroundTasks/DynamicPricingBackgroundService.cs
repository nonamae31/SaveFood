using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SaveFoodBackend.Data;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services.BackgroundTasks;

public class DynamicPricingBackgroundService : BackgroundService
{
    private readonly ILogger<DynamicPricingBackgroundService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

    public DynamicPricingBackgroundService(ILogger<DynamicPricingBackgroundService> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Dynamic Pricing Background Service is starting.");
        using var timer = new PeriodicTimer(_checkInterval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await ProcessDynamicPricingAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing dynamic pricing logic.");
            }
        }
    }

    private async Task ProcessDynamicPricingAsync(CancellationToken ct)
    {
        _logger.LogInformation("Processing dynamic pricing... time: {time}", DateTime.UtcNow);

        using var scope = _serviceProvider.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<SaveFoodDbContext>();
        var redis = scope.ServiceProvider.GetRequiredService<IRedisService>();

        var currentTime = DateTime.UtcNow;

        // Lấy tất cả tin đăng đang Published (Status 1) và chưa hết hạn, kèm theo các rules chưa bị xóa
        var activeListings = await ctx.ClearanceListings
            .Include(l => l.ListingDiscountRules.Where(r => (r.RuleFlags & 2) == 0 && (r.RuleFlags & 1) == 1)) // Not deleted, IsActive = 1
            .Where(l => (l.ListingFlags & 1) == 0 && l.Status == (byte)ListingStatus.Published && l.ExpiryDate > currentTime)
            .ToListAsync(ct);

        int updatedCount = 0;

        foreach (var listing in activeListings)
        {
            var rules = listing.ListingDiscountRules.OrderBy(r => r.RuleOrder).ToList();
            bool priceChanged = false;

            foreach (var rule in rules)
            {
                bool shouldTrigger = false;

                if (rule.TriggerType == (byte)TriggerType.TimeBeforeExpiry)
                {
                    // TriggerValue là số phút trước khi hết hạn
                    var triggerTime = listing.ExpiryDate.AddMinutes(-rule.TriggerValue);
                    if (currentTime >= triggerTime)
                    {
                        shouldTrigger = true;
                    }
                }
                else if (rule.TriggerType == (byte)TriggerType.StockRemaining)
                {
                    // TriggerValue là số lượng tồn kho
                    if (listing.QuantityAvailable <= rule.TriggerValue)
                    {
                        shouldTrigger = true;
                    }
                }

                if (shouldTrigger)
                {
                    decimal newPrice = listing.SalePrice;

                    if (rule.TargetPrice.HasValue)
                    {
                        newPrice = rule.TargetPrice.Value;
                    }
                    else if (rule.DiscountPercent.HasValue)
                    {
                        // Giảm giá theo phần trăm của SalePrice hiện tại (hoặc OriginalPrice tùy logic, hiện dùng SalePrice)
                        newPrice = listing.SalePrice * (1 - rule.DiscountPercent.Value / 100);
                    }

                    if (newPrice < listing.SalePrice)
                    {
                        listing.SalePrice = newPrice;
                        priceChanged = true;
                        
                        // Disable rule để không áp dụng lại
                        rule.RuleFlags = (byte)(rule.RuleFlags & ~1); 
                    }
                }
            }

            if (priceChanged)
            {
                updatedCount++;
            }
        }

        if (updatedCount > 0)
        {
            await ctx.SaveChangesAsync(ct);
            await redis.DeleteByPatternAsync("listings:*");
            _logger.LogInformation("Updated pricing for {count} listings and cleared cache.", updatedCount);
        }

        // ─── Tự động chuyển sang Đã Bán Hết khi số lượng về 0 ─────────────────
        var soldOutListings = await ctx.ClearanceListings
            .Where(l => (l.ListingFlags & 1) == 0                         // Not deleted
                     && l.Status == (byte)ListingStatus.Published          // Đang bán
                     && l.QuantityAvailable <= 0                           // Hết hàng
                     && l.ExpiryDate > currentTime)                        // Chưa hết hạn (nếu hết hạn thì Expired ưu tiên hơn)
            .ToListAsync(ct);

        if (soldOutListings.Count > 0)
        {
            foreach (var listing in soldOutListings)
            {
                listing.Status = (byte)ListingStatus.SoldOut;
            }
            await ctx.SaveChangesAsync(ct);
            await redis.DeleteByPatternAsync("listings:*");
            _logger.LogInformation("Auto sold-out {count} listings.", soldOutListings.Count);
        }

        // ─── Tự động chuyển sang Hết Hạn khi quá hạn sử dụng ─────────────────
        // Expired ưu tiên cao nhất: kể cả SoldOut cũng được Expired nếu đã quá ngày
        var expiredListings = await ctx.ClearanceListings
            .Where(l => (l.ListingFlags & 1) == 0                         // Not deleted
                     && (l.Status == (byte)ListingStatus.Published         // Đang bán
                      || l.Status == (byte)ListingStatus.SoldOut)          // Hoặc đã bán hết
                     && l.ExpiryDate <= currentTime)                       // Đã quá hạn
            .ToListAsync(ct);

        if (expiredListings.Count > 0)
        {
            foreach (var listing in expiredListings)
            {
                listing.Status = (byte)ListingStatus.Expired;
            }
            await ctx.SaveChangesAsync(ct);
            await redis.DeleteByPatternAsync("listings:*");
            _logger.LogInformation("Auto-expired {count} listings.", expiredListings.Count);
        }
    }
}
