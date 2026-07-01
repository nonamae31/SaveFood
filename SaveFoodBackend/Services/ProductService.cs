using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store.Products;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _repo;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IStoreRepository _storeRepo;

    public ProductService(IProductRepository repo, ICloudinaryService cloudinaryService, IStoreRepository storeRepo)
    {
        _repo = repo;
        _cloudinaryService = cloudinaryService;
        _storeRepo = storeRepo;
    }
    //
    public async Task<ProductResponseDTO?> GetProductByIdAsync(Guid storeId, Guid productId, CancellationToken ct = default)
    {
        var product = await _repo.GetByIdAsync(productId, ct);
        if (product == null || product.StoreId != storeId)
        {
            return null;
        }

        return MapToDTO(product);
    }

    public async Task<IEnumerable<ProductResponseDTO>> GetProductsByStoreAsync(Guid storeId, CancellationToken ct = default)
    {
        var products = await _repo.GetByStoreIdAsync(storeId, ct);
        return products.Select(MapToDTO);
    }

    public async Task<ProductResponseDTO> CreateProductAsync(Guid storeId, CreateProductDTO dto, CancellationToken ct = default)
    {
        var store = await _storeRepo.GetByIdAsync(storeId, ct);
        if (store == null || store.Status != (byte)StoreStatus.Active)
        {
            throw new Exception("Cửa hàng không hoạt động. Không thể tạo sản phẩm.");
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            CategoryId = dto.CategoryId,
            Name = dto.Name,
            Description = dto.Description,
            OriginalPrice = dto.OriginalPrice,
            CreatedAt = DateTime.UtcNow,
            IsSurpriseBag = dto.IsSurpriseBag,
            ProductImages = new List<ProductImage>()
        };

        await _repo.AddAsync(product, ct);
        await _repo.SaveChangesAsync(ct);

        return MapToDTO(product);
    }

    public async Task<ProductResponseDTO> UpdateProductAsync(Guid storeId, Guid productId, UpdateProductDTO dto, CancellationToken ct = default)
    {
        var product = await _repo.GetByIdAsync(productId, ct);
        if (product == null || product.StoreId != storeId)
        {
            throw new Exception("Product not found or access denied");
        }

        product.CategoryId = dto.CategoryId;
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.OriginalPrice = dto.OriginalPrice;
        product.IsHidden = dto.IsHidden;
        product.IsSurpriseBag = dto.IsSurpriseBag;

        _repo.Update(product);
        await _repo.SaveChangesAsync(ct);

        return MapToDTO(product);
    }

    public async Task DeleteProductAsync(Guid storeId, Guid productId, CancellationToken ct = default)
    {
        var product = await _repo.GetByIdAsync(productId, ct);
        if (product == null || product.StoreId != storeId)
        {
            throw new Exception("Product not found or access denied");
        }

        _repo.Delete(product);
        await _repo.SaveChangesAsync(ct);
    }

    public async Task<ProductResponseDTO> UploadProductImagesAsync(Guid storeId, Guid productId, IEnumerable<Microsoft.AspNetCore.Http.IFormFile> files, CancellationToken ct = default)
    {
        var product = await _repo.GetByIdAsync(productId, ct);
        if (product == null || product.StoreId != storeId)
        {
            throw new Exception("Product not found or access denied");
        }

        if (files != null && files.Any())
        {
            var uploadResults = await _cloudinaryService.UploadImagesAsync(files);
            foreach (var result in uploadResults)
            {
                product.ProductImages.Add(new ProductImage
                {
                    ImageUrl = result.SecureUrl,
                    CloudinaryPublicId = result.PublicId,
                    ImageFlags = 0
                });
            }
            await _repo.SaveChangesAsync(ct);
        }
        
        return MapToDTO(product);
    }

    public async Task<ProductResponseDTO> DeleteProductImageAsync(Guid storeId, Guid productId, Guid imageId, CancellationToken ct = default)
    {
        var product = await _repo.GetByIdAsync(productId, ct);
        if (product == null || product.StoreId != storeId)
        {
            throw new Exception("Product not found or access denied");
        }

        var image = product.ProductImages.FirstOrDefault(i => i.Id == imageId);
        if (image != null)
        {
            if (!string.IsNullOrEmpty(image.CloudinaryPublicId))
            {
                await _cloudinaryService.DeleteImageAsync(image.CloudinaryPublicId);
            }
            _repo.RemoveImage(image);
            await _repo.SaveChangesAsync(ct);
        }

        return MapToDTO(product);
    }

    private static ProductResponseDTO MapToDTO(Product product)
    {
        return new ProductResponseDTO
        {
            Id = product.Id,
            StoreId = product.StoreId,
            CategoryId = product.CategoryId,
            Name = product.Name,
            Description = product.Description,
            OriginalPrice = product.OriginalPrice,
            IsHidden = product.IsHidden,
            IsSurpriseBag = product.IsSurpriseBag,
            CreatedAt = product.CreatedAt,
            Images = product.ProductImages?.Select(img => new ProductImageResponseDTO
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl
            }).ToList() ?? new List<ProductImageResponseDTO>()
        };
    }
}
