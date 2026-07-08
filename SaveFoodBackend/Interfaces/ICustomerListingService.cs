using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Customer.Listings;

namespace SaveFoodBackend.Interfaces;

public interface ICustomerListingService
{
    Task<IEnumerable<CustomerListingDTO>> GetListingsAsync(CustomerListingFilterDTO filter, CancellationToken ct = default);
    Task<IEnumerable<CustomerListingDTO>> GetRecommendationsAsync(Guid userId, double? userLat = null, double? userLng = null, CancellationToken ct = default);
}
