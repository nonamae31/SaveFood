using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Repositories;

public class CheckoutReservationRepository : ICheckoutReservationRepository
{
    private readonly IMemoryCache _cache;

    // A static dictionary to keep track of active listing IDs so we don't have to scan all cache keys
    private static readonly ConcurrentDictionary<Guid, byte> _activeListings = new();

    public CheckoutReservationRepository(IMemoryCache cache)
    {
        _cache = cache;
    }

    private string GetCacheKey(Guid listingId) => $"Reservations_{listingId}";

    public Task AddRangeAsync(IEnumerable<CheckoutReservation> reservations, CancellationToken cancellationToken)
    {
        var groups = reservations.GroupBy(r => r.ListingId);
        
        foreach (var group in groups)
        {
            var listingId = group.Key;
            var key = GetCacheKey(listingId);
            
            _activeListings.TryAdd(listingId, 1);

            // Fetch existing
            var existing = _cache.Get<List<CheckoutReservation>>(key) ?? new List<CheckoutReservation>();
            
            // Cleanup expired
            existing.RemoveAll(r => r.ExpiresAt <= DateTime.UtcNow);
            
            // Add new
            existing.AddRange(group);
            
            // Set with sliding/absolute expiration based on the maximum ExpiresAt
            var maxExpiresAt = existing.Max(r => r.ExpiresAt);
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpiration = maxExpiresAt
            };
            
            _cache.Set(key, existing, cacheOptions);
        }

        return Task.CompletedTask;
    }

    public Task<IEnumerable<CheckoutReservation>> GetActiveByListingIdAsync(Guid listingId, CancellationToken cancellationToken)
    {
        var key = GetCacheKey(listingId);
        var existing = _cache.Get<List<CheckoutReservation>>(key);
        
        if (existing == null)
            return Task.FromResult<IEnumerable<CheckoutReservation>>(new List<CheckoutReservation>());

        var active = existing.Where(r => r.ExpiresAt > DateTime.UtcNow).ToList();
        return Task.FromResult<IEnumerable<CheckoutReservation>>(active);
    }

    public Task RemoveUserReservationAsync(Guid listingId, Guid userId, CancellationToken cancellationToken)
    {
        var key = GetCacheKey(listingId);
        var existing = _cache.Get<List<CheckoutReservation>>(key);
        
        if (existing != null)
        {
            existing.RemoveAll(r => r.UserId == userId);
            
            if (existing.Any())
            {
                var maxExpiresAt = existing.Max(r => r.ExpiresAt);
                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpiration = maxExpiresAt
                };
                _cache.Set(key, existing, cacheOptions);
            }
            else
            {
                _cache.Remove(key);
                _activeListings.TryRemove(listingId, out _);
            }
        }

        return Task.CompletedTask;
    }
}
