using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Http;
using SaveFoodBackend.Application.Features.Products.Queries;
using SaveFoodBackend.DTOs.Store.Products;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Features.Products.Commands;

// ─── Create Product ────────────────────────────────────────────────────────────

public record CreateProductCommand(Guid StoreId, CreateProductDTO Dto) : IRequest<ProductResponseDTO>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductResponseDTO>
{
    private readonly IProductRepository _repo;
    private readonly IStoreRepository _storeRepo;

    public CreateProductCommandHandler(IProductRepository repo, IStoreRepository storeRepo)
    {
        _repo = repo;
        _storeRepo = storeRepo;
    }

    public async Task<ProductResponseDTO> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var store = await _storeRepo.GetByIdAsync(request.StoreId, ct);
        if (store == null || store.Status != (byte)StoreStatus.Active)
            throw new InvalidOperationException("Cửa hàng không hoạt động. Không thể tạo sản phẩm.");

        var product = new Product
        {
            Id = Guid.NewGuid(),
            StoreId = request.StoreId,
            CategoryId = request.Dto.CategoryId,
            Name = request.Dto.Name,
            Description = request.Dto.Description,
            OriginalPrice = request.Dto.OriginalPrice,
            CreatedAt = DateTime.UtcNow,
            IsSurpriseBag = request.Dto.IsSurpriseBag,
            ProductImages = new List<ProductImage>()
        };

        await _repo.AddAsync(product, ct);
        await _repo.SaveChangesAsync(ct);

        // Reload to include Category (was just inserted, repo cached without navigations)
        var created = await _repo.GetByIdAsync(product.Id, ct);
        return GetProductByIdQueryHandler.MapToDTO(created ?? product);
    }
}

// ─── Update Product ────────────────────────────────────────────────────────────

public record UpdateProductCommand(Guid StoreId, Guid ProductId, UpdateProductDTO Dto) : IRequest<ProductResponseDTO>;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductResponseDTO>
{
    private readonly IProductRepository _repo;

    public UpdateProductCommandHandler(IProductRepository repo) => _repo = repo;

    public async Task<ProductResponseDTO> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.ProductId, ct);
        if (product == null || product.StoreId != request.StoreId)
            throw new InvalidOperationException("Product not found or access denied");

        product.CategoryId = request.Dto.CategoryId;
        product.Name = request.Dto.Name;
        product.Description = request.Dto.Description;
        product.OriginalPrice = request.Dto.OriginalPrice;
        product.IsHidden = request.Dto.IsHidden;
        product.IsSurpriseBag = request.Dto.IsSurpriseBag;

        _repo.Update(product);
        await _repo.SaveChangesAsync(ct);

        return GetProductByIdQueryHandler.MapToDTO(product);
    }
}

// ─── Delete Product ────────────────────────────────────────────────────────────

public record DeleteProductCommand(Guid StoreId, Guid ProductId) : IRequest;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand>
{
    private readonly IProductRepository _repo;

    public DeleteProductCommandHandler(IProductRepository repo) => _repo = repo;

    public async Task Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.ProductId, ct);
        if (product == null || product.StoreId != request.StoreId)
            throw new InvalidOperationException("Product not found or access denied");

        _repo.Delete(product);
        await _repo.SaveChangesAsync(ct);
    }
}

// ─── Upload Product Images ─────────────────────────────────────────────────────

public record UploadProductImagesCommand(Guid StoreId, Guid ProductId, IEnumerable<IFormFile> Files) : IRequest<ProductResponseDTO>;

public class UploadProductImagesCommandHandler : IRequestHandler<UploadProductImagesCommand, ProductResponseDTO>
{
    private readonly IProductRepository _repo;
    private readonly ICloudinaryService _cloudinary;

    public UploadProductImagesCommandHandler(IProductRepository repo, ICloudinaryService cloudinary)
    {
        _repo = repo;
        _cloudinary = cloudinary;
    }

    public async Task<ProductResponseDTO> Handle(UploadProductImagesCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.ProductId, ct);
        if (product == null || product.StoreId != request.StoreId)
            throw new InvalidOperationException("Product not found or access denied");

        if (request.Files != null && request.Files.Any())
        {
            var uploadResults = await _cloudinary.UploadImagesAsync(request.Files);
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

        return GetProductByIdQueryHandler.MapToDTO(product);
    }
}

// ─── Delete Product Image ──────────────────────────────────────────────────────

public record DeleteProductImageCommand(Guid StoreId, Guid ProductId, Guid ImageId) : IRequest<ProductResponseDTO>;

public class DeleteProductImageCommandHandler : IRequestHandler<DeleteProductImageCommand, ProductResponseDTO>
{
    private readonly IProductRepository _repo;
    private readonly ICloudinaryService _cloudinary;

    public DeleteProductImageCommandHandler(IProductRepository repo, ICloudinaryService cloudinary)
    {
        _repo = repo;
        _cloudinary = cloudinary;
    }

    public async Task<ProductResponseDTO> Handle(DeleteProductImageCommand request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.ProductId, ct);
        if (product == null || product.StoreId != request.StoreId)
            throw new InvalidOperationException("Product not found or access denied");

        var image = product.ProductImages.FirstOrDefault(i => i.Id == request.ImageId);
        if (image != null)
        {
            if (!string.IsNullOrEmpty(image.CloudinaryPublicId))
                await _cloudinary.DeleteImageAsync(image.CloudinaryPublicId);

            _repo.RemoveImage(image);
            await _repo.SaveChangesAsync(ct);
        }

        return GetProductByIdQueryHandler.MapToDTO(product);
    }
}
