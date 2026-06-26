using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Store.Products;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[ApiController]
[Route("api/stores/{storeId}/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }
    //
    [HttpGet]
    public async Task<IActionResult> GetProducts(Guid storeId, CancellationToken ct)
    {
        var products = await _productService.GetProductsByStoreAsync(storeId, ct);
        return Ok(products);
    }

    [HttpGet("{productId}")]
    public async Task<IActionResult> GetProduct(Guid storeId, Guid productId, CancellationToken ct)
    {
        var product = await _productService.GetProductByIdAsync(storeId, productId, ct);
        if (product == null)
            return NotFound();
            
        return Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct(Guid storeId, [FromBody] CreateProductDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var product = await _productService.CreateProductAsync(storeId, dto, ct);
        return CreatedAtAction(nameof(GetProduct), new { storeId, productId = product.Id }, product);
    }
    //
    //
    [HttpPut("{productId}")]
    public async Task<IActionResult> UpdateProduct(Guid storeId, Guid productId, [FromBody] UpdateProductDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var product = await _productService.UpdateProductAsync(storeId, productId, dto, ct);
            return Ok(product);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpDelete("{productId}")]
    public async Task<IActionResult> DeleteProduct(Guid storeId, Guid productId, CancellationToken ct)
    {
        try
        {
            await _productService.DeleteProductAsync(storeId, productId, ct);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
