using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;

namespace SaveFoodBackend.Interfaces;

public interface ICategoryService
{
    /// <summary>
    /// Lấy tất cả danh mục. Admin thấy cả đã xóa mềm, Khách chỉ thấy Active.
    /// </summary>
    Task<IEnumerable<CategoryResponseDTO>> GetAllAsync(bool includeDeleted = false);

    /// <summary>
    /// Lấy chi tiết một danh mục theo Id.
    /// </summary>
    Task<CategoryResponseDTO> GetByIdAsync(Guid id);

    /// <summary>
    /// Tạo mới một danh mục. Trả về DTO của danh mục vừa tạo.
    /// </summary>
    Task<CategoryResponseDTO> CreateAsync(CategoryRequestDTO request);

    /// <summary>
    /// Cập nhật tên danh mục.
    /// </summary>
    Task<CategoryResponseDTO> UpdateAsync(Guid id, CategoryRequestDTO request);

    /// <summary>
    /// Xóa mềm (Soft Delete) một danh mục bằng cách set IsDeleted = true.
    /// </summary>
    Task DeleteAsync(Guid id);

    /// <summary>
    /// Khôi phục danh mục đã bị xóa mềm.
    /// </summary>
    Task RestoreAsync(Guid id);
}
