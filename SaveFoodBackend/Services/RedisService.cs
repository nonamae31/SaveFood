using Microsoft.Extensions.Caching.Distributed;
using SaveFoodBackend.Interfaces;
using StackExchange.Redis;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;

namespace SaveFoodBackend.Services
{
    public class RedisService : IRedisService
    {
        private readonly IDistributedCache _cache;
        private readonly IConnectionMultiplexer? _redis;

        // Prefix phải khớp với InstanceName trong AddStackExchangeRedisCache (Program.cs)
        private const string InstancePrefix = "SaveFood_";

        public RedisService(IDistributedCache cache, IServiceProvider serviceProvider)
        {
            _cache = cache;
            _redis = serviceProvider.GetService<IConnectionMultiplexer>();
        }

        public async Task SetAsync(string key, string value, TimeSpan? expiry = null)
        {
            var options = new DistributedCacheEntryOptions();
            if (expiry.HasValue)
                options.SetAbsoluteExpiration(expiry.Value);
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

        /// <summary>
        /// Xóa tất cả Redis keys khớp với pattern (SCAN + UNLINK, non-blocking).
        /// Pattern truyền vào KHÔNG cần prefix — method này tự thêm InstancePrefix.
        /// Ví dụ: DeleteByPatternAsync("listings:*") → scan "SaveFood_listings:*"
        /// </summary>
        public async Task DeleteByPatternAsync(string pattern)
        {
            if (_redis == null) return; // Nếu không dùng Redis thực tế (in-memory) thì bỏ qua scan keys

            var server = _redis.GetServer(_redis.GetEndPoints()[0]);
            var db = _redis.GetDatabase();
            var fullPattern = $"{InstancePrefix}{pattern}";

            await foreach (var key in server.KeysAsync(pattern: fullPattern))
            {
                await db.KeyDeleteAsync(key);
            }
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

