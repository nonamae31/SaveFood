using System;
using System.Threading.Tasks;
using StackExchange.Redis;
using Microsoft.Extensions.Logging;

namespace SaveFoodBackend.Services;

public interface ICheckoutQueueService
{
    Task<bool> AcquireLockAsync(string resourceKey, string lockValue, TimeSpan expiry);
    Task ReleaseLockAsync(string resourceKey, string lockValue);
    Task EnqueuePriorityAsync(string queueKey, string userId, double priorityScore);
    Task DequeuePriorityAsync(string queueKey, string userId);
    Task<bool> IsMyTurnAsync(string queueKey, string userId);
    Task RecordCheckoutIntentAsync(Guid listingId, Guid userId, TimeSpan duration);
    Task<List<Guid>> GetActiveCheckoutIntentsAsync(Guid listingId);
}

public class CheckoutQueueService : ICheckoutQueueService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<CheckoutQueueService> _logger;

    public CheckoutQueueService(IServiceProvider serviceProvider, ILogger<CheckoutQueueService> logger)
    {
        _redis = Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetService<IConnectionMultiplexer>(serviceProvider);
        _logger = logger;
    }

    public async Task<bool> AcquireLockAsync(string resourceKey, string lockValue, TimeSpan expiry)
    {
        if (_redis == null) return true;

        try
        {
            var db = _redis.GetDatabase();
            return await db.StringSetAsync(resourceKey, lockValue, expiry, When.NotExists);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acquiring Redis lock for {ResourceKey}", resourceKey);
            return true;
        }
    }

    public async Task ReleaseLockAsync(string resourceKey, string lockValue)
    {
        if (_redis == null) return;

        try
        {
            var db = _redis.GetDatabase();
            string script = @"
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end";
                
            await db.ScriptEvaluateAsync(script, new RedisKey[] { resourceKey }, new RedisValue[] { lockValue });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error releasing Redis lock for {ResourceKey}", resourceKey);
        }
    }

    public async Task EnqueuePriorityAsync(string queueKey, string userId, double priorityScore)
    {
        if (_redis == null) return;
        var db = _redis.GetDatabase();
        // Negative score so highest priority comes first (lowest negative number)
        await db.SortedSetAddAsync(queueKey, userId, -priorityScore);
    }

    public async Task DequeuePriorityAsync(string queueKey, string userId)
    {
        if (_redis == null) return;
        var db = _redis.GetDatabase();
        await db.SortedSetRemoveAsync(queueKey, userId);
    }

    public async Task<bool> IsMyTurnAsync(string queueKey, string userId)
    {
        if (_redis == null) return true;
        var db = _redis.GetDatabase();
        // Get the top user
        var topUsers = await db.SortedSetRangeByRankAsync(queueKey, 0, 0);
        if (topUsers.Length > 0 && topUsers[0] == userId)
        {
            return true;
        }
        return false;
    }

    public async Task RecordCheckoutIntentAsync(Guid listingId, Guid userId, TimeSpan duration)
    {
        if (_redis == null) return;
        var db = _redis.GetDatabase();
        string key = $"intent:{listingId}";
        double expiryScore = DateTimeOffset.UtcNow.Add(duration).ToUnixTimeSeconds();
        await db.SortedSetAddAsync(key, userId.ToString(), expiryScore);
    }

    public async Task<List<Guid>> GetActiveCheckoutIntentsAsync(Guid listingId)
    {
        if (_redis == null) return new List<Guid>();
        var db = _redis.GetDatabase();
        string key = $"intent:{listingId}";
        double now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        
        // Clean up expired
        await db.SortedSetRemoveRangeByScoreAsync(key, double.NegativeInfinity, now);
        
        // Get active
        var members = await db.SortedSetRangeByScoreAsync(key, now, double.PositiveInfinity);
        
        var result = new List<Guid>();
        foreach (var m in members)
        {
            if (Guid.TryParse(m, out var uid))
                result.Add(uid);
        }
        return result;
    }
}
