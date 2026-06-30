using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface IListingRepository
{
    Task<ClearanceListing?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ClearanceListing?> GetByIdWithRulesAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<ClearanceListing>> GetByStoreIdAsync(Guid storeId, CancellationToken ct = default);
    Task<int> GetActiveListingsCountByStoreAsync(Guid storeId, CancellationToken ct = default);
    Task<IEnumerable<ClearanceListing>> GetAllActiveListingsAsync(CancellationToken ct = default);
    Task<IEnumerable<ClearanceListing>> GetCustomerListingsAsync(Guid? storeId, List<Guid>? categoryIds, decimal? minPrice, decimal? maxPrice, bool? isSurpriseBag, string? sortBy, string? searchQuery, CancellationToken ct = default);
    Task AddAsync(ClearanceListing listing, CancellationToken ct = default);
    void Update(ClearanceListing listing);
    void Delete(ClearanceListing listing);
    void RemoveImage(ListingImage image);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
