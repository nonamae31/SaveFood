using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Application.Features.Products.Commands;
using SaveFoodBackend.Application.Features.Products.Queries;
using SaveFoodBackend.DTOs.Store.Products;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/stores/{storeId}/products")]
[Authorize(Roles = "Store,StoreStaff")]
public class ProductsController : ApiControllerBase
{
    private readonly ISender _sender;

    public ProductsController(ISender sender) => _sender = sender;

    /// <summary>Lấy tất cả sản phẩm của Store.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts(Guid storeId, CancellationToken ct)
    {
        var result = await _sender.Send(new GetProductsByStoreQuery(storeId), ct);
        return Ok(result);
    }

    /// <summary>Lấy chi tiết sản phẩm (bao gồm Category và Images — AsSplitQuery).</summary>
    [HttpGet("{productId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProduct(Guid storeId, Guid productId, CancellationToken ct)
    {
        var result = await _sender.Send(new GetProductByIdQuery(storeId, productId), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    /// <summary>Tạo sản phẩm mới.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateProduct(Guid storeId, [FromBody] CreateProductDTO dto, CancellationToken ct)
    {
        var product = await _sender.Send(new CreateProductCommand(storeId, dto), ct);
        return CreatedAtAction(nameof(GetProduct), new { storeId, productId = product.Id }, product);
    }

    /// <summary>Cập nhật sản phẩm.</summary>
    [HttpPut("{productId}")]
    public async Task<IActionResult> UpdateProduct(Guid storeId, Guid productId, [FromBody] UpdateProductDTO dto, CancellationToken ct)
    {
        var product = await _sender.Send(new UpdateProductCommand(storeId, productId, dto), ct);
        return Ok(product);
    }

    /// <summary>Xóa mềm sản phẩm.</summary>
    [HttpDelete("{productId}")]
    public async Task<IActionResult> DeleteProduct(Guid storeId, Guid productId, CancellationToken ct)
    {
        await _sender.Send(new DeleteProductCommand(storeId, productId), ct);
        return NoContent();
    }

    /// <summary>Upload ảnh cho sản phẩm.</summary>
    [HttpPost("{productId}/images")]
    public async Task<IActionResult> UploadProductImages(Guid storeId, Guid productId, IEnumerable<IFormFile> images, CancellationToken ct)
    {
        var product = await _sender.Send(new UploadProductImagesCommand(storeId, productId, images), ct);
        return Ok(product);
    }

    /// <summary>Xóa ảnh sản phẩm.</summary>
    [HttpDelete("{productId}/images/{imageId}")]
    public async Task<IActionResult> DeleteProductImage(Guid storeId, Guid productId, Guid imageId, CancellationToken ct)
    {
        var product = await _sender.Send(new DeleteProductImageCommand(storeId, productId, imageId), ct);
        return Ok(product);
    }
}
