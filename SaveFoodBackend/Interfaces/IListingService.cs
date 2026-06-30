using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store.Listings;

namespace SaveFoodBackend.Interfaces;

public interface IListingService
{
    Task<IEnumerable<ListingResponseDTO>> GetListingsByStoreAsync(Guid storeId, CancellationToken ct = default);
    Task<ListingResponseDTO?> GetListingByIdAsync(Guid storeId, Guid listingId, CancellationToken ct = default);
    Task<ListingResponseDTO> CreateListingAsync(Guid storeId, CreateListingDTO dto, CancellationToken ct = default);
    Task<ListingResponseDTO> UpdateListingAsync(Guid storeId, Guid listingId, UpdateListingDTO dto, CancellationToken ct = default);
    Task DeleteListingAsync(Guid storeId, Guid listingId, CancellationToken ct = default);
    Task<ListingResponseDTO> UploadListingImagesAsync(Guid storeId, Guid listingId, System.Collections.Generic.IEnumerable<Microsoft.AspNetCore.Http.IFormFile> files, CancellationToken ct = default);
    Task<ListingResponseDTO> DeleteListingImageAsync(Guid storeId, Guid listingId, Guid imageId, CancellationToken ct = default);
}
