using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs;
using SaveFoodBackend.Models;
using SaveFoodBackend.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SaveFoodBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController(IProductRepository productRepo) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductResponse>>>> GetAll(CancellationToken ct)
        {
            var products = await productRepo.GetAllAsync(ct);
            var response = products.Select(p => new ProductResponse
            {
                Id = p.Id,
                Name = p.Name,
                OriginalPrice = p.OriginalPrice,
                DiscountedPrice = p.DiscountedPrice,
                StockQuantity = p.StockQuantity,
                ExpiryDate = p.ExpiryDate
            });
            return Ok(ApiResponse<IEnumerable<ProductResponse>>.Ok(response));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<ProductResponse>>> Create(CreateProductRequest request, CancellationToken ct)
        {
            var product = new Product
            {
                Name = request.Name,
                OriginalPrice = request.OriginalPrice,
                DiscountedPrice = request.DiscountedPrice,
                StockQuantity = request.StockQuantity,
                ExpiryDate = request.ExpiryDate
            };

            await productRepo.AddAsync(product, ct);
            await productRepo.SaveChangesAsync(ct);

            var response = new ProductResponse
            {
                Id = product.Id,
                Name = product.Name,
                OriginalPrice = product.OriginalPrice,
                DiscountedPrice = product.DiscountedPrice,
                StockQuantity = product.StockQuantity,
                ExpiryDate = product.ExpiryDate
            };

            return CreatedAtAction(nameof(Get), new { id = product.Id }, ApiResponse<ProductResponse>.Ok(response, "Product created successfully"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<ProductResponse>>> Get(Guid id, CancellationToken ct)
        {
            var product = await productRepo.GetByIdAsync(id, ct);
            if (product == null)
            {
                return NotFound(ApiResponse<ProductResponse>.Fail("Product not found"));
            }

            var response = new ProductResponse
            {
                Id = product.Id,
                Name = product.Name,
                OriginalPrice = product.OriginalPrice,
                DiscountedPrice = product.DiscountedPrice,
                StockQuantity = product.StockQuantity,
                ExpiryDate = product.ExpiryDate
            };
            return Ok(ApiResponse<ProductResponse>.Ok(response));
        }
    }
}
