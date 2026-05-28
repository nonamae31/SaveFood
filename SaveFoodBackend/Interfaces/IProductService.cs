using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store.Products;

namespace SaveFoodBackend.Interfaces;

public interface IProductService
{
    Task<ProductResponseDTO?> GetProductByIdAsync(Guid storeId, Guid productId, CancellationToken ct = default);
    Task<IEnumerable<ProductResponseDTO>> GetProductsByStoreAsync(Guid storeId, CancellationToken ct = default);
    Task<ProductResponseDTO> CreateProductAsync(Guid storeId, CreateProductDTO dto, CancellationToken ct = default);
    Task<ProductResponseDTO> UpdateProductAsync(Guid storeId, Guid productId, UpdateProductDTO dto, CancellationToken ct = default);
    Task DeleteProductAsync(Guid storeId, Guid productId, CancellationToken ct = default);
    Task<ProductResponseDTO> UploadProductImagesAsync(Guid storeId, Guid productId, IEnumerable<Microsoft.AspNetCore.Http.IFormFile> files, CancellationToken ct = default);
    Task<ProductResponseDTO> DeleteProductImageAsync(Guid storeId, Guid productId, Guid imageId, CancellationToken ct = default);
}
