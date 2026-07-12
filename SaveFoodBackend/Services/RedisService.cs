using Microsoft.Extensions.Caching.Distributed;
using SaveFoodBackend.Interfaces;
using System;
using System.Threading.Tasks;

namespace SaveFoodBackend.Services
{
    public class RedisService : IRedisService
    {
        private readonly IDistributedCache _cache;

        public RedisService(IDistributedCache cache)
        {
            _cache = cache;
        }

        public async Task SetAsync(string key, string value, TimeSpan? expiry = null)
        {
            var options = new DistributedCacheEntryOptions();
            if (expiry.HasValue)
            {
                options.SetAbsoluteExpiration(expiry.Value);
            }
            await _cache.SetStringAsync(key, value, options);
        }

        public async Task<string?> GetAsync(string key)
        {
            return await _cache.GetStringAsync(key);
        }

        public async Task DeleteAsync(string key)
        {
            await _cache.RemoveAsync(key);
        }

        public async Task SetTokenBlacklistAsync(string token, TimeSpan expiry)
        {
            var key = $"blacklist:{token}";
            await SetAsync(key, "revoked", expiry);
        }

        public async Task<bool> IsTokenBlacklistedAsync(string token)
        {
            var key = $"blacklist:{token}";
            var value = await GetAsync(key);
            return !string.IsNullOrEmpty(value);
        }

        /// <inheritdoc/>
        public async Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan expiry)
        {
            var existing = await _cache.GetStringAsync(key);
            if (existing != null) return false; // key đã tồn tại
            await SetAsync(key, value, expiry);
            return true; // đã set (race window ~1ms, DB backstop cover phần còn lại)
        }
    }
}
