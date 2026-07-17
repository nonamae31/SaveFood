using System;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services;

public class RedisIdempotencyService : IIdempotencyService
{
    private readonly IRedisService _redisService;

    public RedisIdempotencyService(IRedisService redisService)
    {
        _redisService = redisService;
    }

    public async Task<bool> TryAcquireKeyAsync(string idempotencyKey, TimeSpan expiry)
    {
        return await _redisService.SetIfNotExistsAsync($"idempotency:{idempotencyKey}", "1", expiry);
    }
}
