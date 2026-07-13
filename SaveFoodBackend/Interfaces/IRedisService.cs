using System;
using System.Threading.Tasks;

namespace SaveFoodBackend.Interfaces
{
    public interface IRedisService
    {
        Task SetAsync(string key, string value, TimeSpan? expiry = null);
        Task<string?> GetAsync(string key);
        Task DeleteAsync(string key);
        /// <summary>
        /// Xóa tất cả các Redis keys khớp với pattern (dùng SCAN + UNLINK).
        /// Ví dụ: DeleteByPatternAsync("listings:*") xóa mọi cache listings.
        /// </summary>
        Task DeleteByPatternAsync(string pattern);
        Task SetTokenBlacklistAsync(string token, TimeSpan expiry);
        Task<bool> IsTokenBlacklistedAsync(string token);
        /// <summary>
        /// GET then SET pattern. Returns true nếu key chưa tồn tại và đã set thành công.
        /// Race window ~1ms, chấp nhận được vì có DB unique constraint làm backstop.
        /// </summary>
        Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan expiry);
    }
}
