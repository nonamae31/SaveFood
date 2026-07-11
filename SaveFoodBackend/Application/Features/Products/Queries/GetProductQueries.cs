using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.DTOs.Store.Products;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Features.Products.Queries;

// ─── Query: Get product by id ─────────────────────────────────────────────────

public record GetProductByIdQuery(Guid StoreId, Guid ProductId) : IRequest<ProductResponseDTO?>;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductResponseDTO?>
{
    private readonly IProductRepository _repo;

    public GetProductByIdQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<ProductResponseDTO?> Handle(GetProductByIdQuery request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.ProductId, ct);
        if (product == null || product.StoreId != request.StoreId)
            return null;

        return MapToDTO(product);
    }

    internal static ProductResponseDTO MapToDTO(Product product) => new()
    {
        Id = product.Id,
        StoreId = product.StoreId,
        CategoryId = product.CategoryId,
        CategoryName = product.Category?.Name,
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
        }).ToList() ?? new()
    };
}

//Query: Get all products by store

public record GetProductsByStoreQuery(Guid StoreId) : IRequest<IEnumerable<ProductResponseDTO>>;

public class GetProductsByStoreQueryHandler : IRequestHandler<GetProductsByStoreQuery, IEnumerable<ProductResponseDTO>>
{
    private readonly IProductRepository _repo;

    public GetProductsByStoreQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<IEnumerable<ProductResponseDTO>> Handle(GetProductsByStoreQuery request, CancellationToken ct)
    {
        var products = await _repo.GetByStoreIdAsync(request.StoreId, ct);
        return products.Select(GetProductByIdQueryHandler.MapToDTO);
    }
}
