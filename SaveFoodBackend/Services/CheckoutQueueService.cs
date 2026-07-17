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
    Task<Dictionary<Guid, double>> GetActiveCheckoutIntentsWithExpiryAsync(Guid listingId);
}

public class CheckoutQueueService : ICheckoutQueueService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<CheckoutQueueService> _logger;

    // ── IN-MEMORY FALLBACK CHO MÔI TRƯỜNG PRODUCTION (KHÔNG CÓ REDIS) ──
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string Value, DateTimeOffset Expiry)> _memLocks = new();
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, System.Collections.Concurrent.ConcurrentDictionary<string, double>> _memQueues = new();
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, System.Collections.Concurrent.ConcurrentDictionary<string, double>> _memIntents = new();

    public CheckoutQueueService(IServiceProvider serviceProvider, ILogger<CheckoutQueueService> logger)
    {
        _redis = Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetService<IConnectionMultiplexer>(serviceProvider);
        _logger = logger;
    }

    public async Task<bool> AcquireLockAsync(string resourceKey, string lockValue, TimeSpan expiry)
    {
        if (_redis == null) 
        {
            var now = DateTimeOffset.UtcNow;
            if (_memLocks.TryGetValue(resourceKey, out var existingLock))
            {
                if (existingLock.Expiry > now) return false; // Khóa vẫn còn hiệu lực
            }
            _memLocks[resourceKey] = (lockValue, now.Add(expiry));
            return true;
        }

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
        if (_redis == null) 
        {
            if (_memLocks.TryGetValue(resourceKey, out var existingLock) && existingLock.Value == lockValue)
            {
                _memLocks.TryRemove(resourceKey, out _);
            }
            return;
        }

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
        if (_redis == null) 
        {
            var queue = _memQueues.GetOrAdd(queueKey, _ => new System.Collections.Concurrent.ConcurrentDictionary<string, double>());
            queue[userId] = priorityScore;
            return;
        }
        var db = _redis.GetDatabase();
        // Negative score so highest priority comes first (lowest negative number)
        await db.SortedSetAddAsync(queueKey, userId, -priorityScore);
    }

    public async Task DequeuePriorityAsync(string queueKey, string userId)
    {
        if (_redis == null) 
        {
            if (_memQueues.TryGetValue(queueKey, out var queue))
            {
                queue.TryRemove(userId, out _);
            }
            return;
        }
        var db = _redis.GetDatabase();
        await db.SortedSetRemoveAsync(queueKey, userId);
    }

    public async Task<bool> IsMyTurnAsync(string queueKey, string userId)
    {
        if (_redis == null) 
        {
            if (!_memQueues.TryGetValue(queueKey, out var queue) || queue.IsEmpty) return true;
            // Tìm người có điểm cao nhất
            var topUser = queue.OrderByDescending(x => x.Value).FirstOrDefault().Key;
            return topUser == userId;
        }
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
        string key = $"intent:{listingId}";
        double expiryScore = DateTimeOffset.UtcNow.Add(duration).ToUnixTimeSeconds();
        if (_redis == null) 
        {
            var intentGroup = _memIntents.GetOrAdd(key, _ => new System.Collections.Concurrent.ConcurrentDictionary<string, double>());
            intentGroup[userId.ToString()] = expiryScore;
            return;
        }
        var db = _redis.GetDatabase();
        await db.SortedSetAddAsync(key, userId.ToString(), expiryScore);
    }

    public async Task<List<Guid>> GetActiveCheckoutIntentsAsync(Guid listingId)
    {
        string key = $"intent:{listingId}";
        if (_redis == null) 
        {
            if (!_memIntents.TryGetValue(key, out var intentGroup)) return new List<Guid>();
            
            double nowScore = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var activeUsers = new List<Guid>();
            foreach (var kvp in intentGroup)
            {
                if (kvp.Value > nowScore) // Chưa hết hạn
                {
                    if (Guid.TryParse(kvp.Key, out var uid)) activeUsers.Add(uid);
                }
                else 
                {
                    intentGroup.TryRemove(kvp.Key, out _); // Xóa rác
                }
            }
            return activeUsers;
        }
        var db = _redis.GetDatabase();
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

    public async Task<Dictionary<Guid, double>> GetActiveCheckoutIntentsWithExpiryAsync(Guid listingId)
    {
        string key = $"intent:{listingId}";
        if (_redis == null) 
        {
            if (!_memIntents.TryGetValue(key, out var intentGroup)) return new Dictionary<Guid, double>();
            
            double nowScore = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var activeUsers = new Dictionary<Guid, double>();
            foreach (var kvp in intentGroup)
            {
                if (kvp.Value > nowScore) // Chưa hết hạn
                {
                    if (Guid.TryParse(kvp.Key, out var uid)) activeUsers[uid] = kvp.Value;
                }
                else 
                {
                    intentGroup.TryRemove(kvp.Key, out _); // Xóa rác
                }
            }
            return activeUsers;
        }
        var db = _redis.GetDatabase();
        double now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        
        // Clean up expired
        await db.SortedSetRemoveRangeByScoreAsync(key, double.NegativeInfinity, now);
        
        // Get active with scores
        var entries = await db.SortedSetRangeByScoreWithScoresAsync(key, now, double.PositiveInfinity);
        
        var result = new Dictionary<Guid, double>();
        foreach (var entry in entries)
        {
            if (entry.Element.HasValue && Guid.TryParse(entry.Element.ToString(), out var uid))
                result[uid] = entry.Score;
        }
        return result;
    }
}
