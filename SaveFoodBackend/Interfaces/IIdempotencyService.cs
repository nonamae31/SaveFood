using System;
using System.Threading.Tasks;

namespace SaveFoodBackend.Interfaces;

public interface IIdempotencyService
{
    Task<bool> TryAcquireKeyAsync(string idempotencyKey, TimeSpan expiry);
}
