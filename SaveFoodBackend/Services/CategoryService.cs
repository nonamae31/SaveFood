using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Services;

public class CategoryService : ICategoryService
{
    private readonly SaveFoodDbContext _context;

    public CategoryService(SaveFoodDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CategoryResponseDTO>> GetAllAsync(bool includeDeleted = false)
    {
        var query = _context.Categories.AsQueryable();

        if (includeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        return await query
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponseDTO
            {
                Id = c.Id,
                Name = c.Name,
                CreatedAt = c.CreatedAt,
                IsDeleted = c.IsDeleted,
                ProductCount = c.Products.Count
            })
            .ToListAsync();
    }

    public async Task<CategoryResponseDTO> GetByIdAsync(Guid id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new InvalidOperationException("Danh mục không tồn tại.");

        return new CategoryResponseDTO
        {
            Id = category.Id,
            Name = category.Name,
            CreatedAt = category.CreatedAt,
            IsDeleted = category.IsDeleted,
            ProductCount = category.Products.Count
        };
    }

    public async Task<CategoryResponseDTO> CreateAsync(CategoryRequestDTO request)
    {
        var trimmedName = request.Name.Trim();

        // Kiểm tra trùng tên (không phân biệt hoa/thường), kể cả đã xóa mềm
        var exists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == trimmedName.ToLower());

        if (exists)
            throw new InvalidOperationException($"Danh mục '{trimmedName}' đã tồn tại.");

        var category = new Category
        {
            Name = trimmedName
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return new CategoryResponseDTO
        {
            Id = category.Id,
            Name = category.Name,
            CreatedAt = category.CreatedAt,
            IsDeleted = category.IsDeleted,
            ProductCount = 0
        };
    }

    public async Task<CategoryResponseDTO> UpdateAsync(Guid id, CategoryRequestDTO request)
    {
        var category = await _context.Categories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new InvalidOperationException("Danh mục không tồn tại.");

        var trimmedName = request.Name.Trim();

        // Kiểm tra trùng tên với danh mục KHÁC
        var nameConflict = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == trimmedName.ToLower() && c.Id != id);

        if (nameConflict)
            throw new InvalidOperationException($"Danh mục '{trimmedName}' đã tồn tại.");

        category.Name = trimmedName;
        await _context.SaveChangesAsync();

        var productCount = await _context.Products.CountAsync(p => p.CategoryId == id);

        return new CategoryResponseDTO
        {
            Id = category.Id,
            Name = category.Name,
            CreatedAt = category.CreatedAt,
            IsDeleted = category.IsDeleted,
            ProductCount = productCount
        };
    }

    public async Task DeleteAsync(Guid id)
    {
        var category = await _context.Categories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new InvalidOperationException("Danh mục không tồn tại.");

        if (category.IsDeleted)
            throw new InvalidOperationException("Danh mục này đã bị xóa trước đó.");

        // Soft Delete: chỉ đánh dấu, không xóa thật khỏi DB
        category.IsDeleted = true;
        await _context.SaveChangesAsync();
    }

    public async Task RestoreAsync(Guid id)
    {
        var category = await _context.Categories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new InvalidOperationException("Danh mục không tồn tại.");

        if (!category.IsDeleted)
            throw new InvalidOperationException("Danh mục này vẫn đang hoạt động, không cần khôi phục.");

        category.IsDeleted = false;
        await _context.SaveChangesAsync();
    }
}
