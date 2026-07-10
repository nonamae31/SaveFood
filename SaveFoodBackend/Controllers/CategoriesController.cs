using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    // GET: api/categories
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _categoryService.GetAllAsync(includeDeleted: false);
        return Ok(categories);
    }

    // GET: api/categories/all  (Admin — kể cả đã xóa mềm)
    [HttpGet("all")]
    [Authorize(Roles = "ADMIN,Admin")]
    public async Task<IActionResult> GetAllForAdmin()
    {
        var categories = await _categoryService.GetAllAsync(includeDeleted: true);
        return Ok(categories);
    }

    // POST: api/categories
    [HttpPost]
    [Authorize(Roles = "ADMIN,Admin")]
    public async Task<IActionResult> Create([FromBody] CategoryRequestDTO request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _categoryService.CreateAsync(request);
            return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    // PUT: api/categories/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CategoryRequestDTO request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _categoryService.UpdateAsync(id, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return ex.Message.Contains("không tồn tại")
                ? NotFound(new { message = ex.Message })
                : Conflict(new { message = ex.Message });
        }
    }

    // DELETE: api/categories/{id}  (Soft Delete)
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "ADMIN,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _categoryService.DeleteAsync(id);
            return Ok(new { message = "Danh mục đã được xóa thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // PATCH: api/categories/{id}/restore
    [HttpPatch("{id:guid}/restore")]
    [Authorize(Roles = "ADMIN,Admin")]
    public async Task<IActionResult> Restore(Guid id)
    {
        try
        {
            await _categoryService.RestoreAsync(id);
            return Ok(new { message = "Danh mục đã được khôi phục." });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
