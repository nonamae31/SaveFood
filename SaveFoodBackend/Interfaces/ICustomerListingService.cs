using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Customer.Listings;

namespace SaveFoodBackend.Interfaces;

public interface ICustomerListingService
{
<<<<<<< HEAD
    Task<PaginatedList<CustomerListingDTO>> GetListingsAsync(CustomerListingFilterDTO filter, CancellationToken ct = default);
    Task<IEnumerable<CustomerListingDTO>> GetRecommendationsAsync(Guid userId, CancellationToken ct = default);
=======
    Task<IEnumerable<CustomerListingDTO>> GetListingsAsync(CustomerListingFilterDTO filter, CancellationToken ct = default);
    Task<IEnumerable<CustomerListingDTO>> GetRecommendationsAsync(Guid userId, double? userLat = null, double? userLng = null, CancellationToken ct = default);
>>>>>>> origin/Develop_2
}
