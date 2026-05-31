using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Store;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services;

public class StoreStaffService : IStoreStaffService
{
    private readonly IStoreStaffRepository _staffRepo;
    private readonly IUserRepository _userRepo;
    private readonly IStoreRepository _storeRepo;

    public StoreStaffService(
        IStoreStaffRepository staffRepo,
        IUserRepository userRepo,
        IStoreRepository storeRepo)
    {
        _staffRepo = staffRepo;
        _userRepo = userRepo;
        _storeRepo = storeRepo;
    }

    public async Task<IEnumerable<StoreStaffDTO>> GetStoreStaffAsync(Guid storeId, Guid requestingUserId, CancellationToken ct = default)
    {
        // Validate: người dùng phải là thành viên của cửa hàng này
        var requesterRecord = await _staffRepo.GetByStoreAndUserIdAsync(storeId, requestingUserId, ct);
        if (requesterRecord == null)
            throw new UnauthorizedAccessException("Bạn không có quyền xem danh sách nhân viên của cửa hàng này.");

        var staffList = await _staffRepo.GetByStoreIdAsync(storeId, ct);
        return staffList.Select(MapToDTO);
    }

    public async Task<StoreStaffDTO> AddStaffAsync(Guid storeId, Guid requestingUserId, AddStoreStaffRequest request, CancellationToken ct = default)
    {
        // Validate: chỉ Owner mới được thêm Staff
        var requesterRecord = await _staffRepo.GetByStoreAndUserIdAsync(storeId, requestingUserId, ct);
        if (requesterRecord == null || requesterRecord.StaffRoleEnum != StaffRole.Owner)
            throw new UnauthorizedAccessException("Chỉ Chủ cửa hàng (Owner) mới có quyền thêm nhân viên.");

        // Tìm User theo email
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var targetUser = await _userRepo.GetByEmailOrNormalizedEmailAsync(request.Email.Trim(), normalizedEmail, ct);
        if (targetUser == null)
            throw new InvalidOperationException($"Không tìm thấy tài khoản nào với email '{request.Email}'. Vui lòng yêu cầu nhân viên đăng ký tài khoản trước.");

        // Validate: không thể tự thêm chính mình
        if (targetUser.Id == requestingUserId)
            throw new InvalidOperationException("Bạn không thể tự thêm chính mình làm nhân viên.");

        // Validate: User đã là thành viên của cửa hàng chưa?
        var existingRecord = await _staffRepo.GetByStoreAndUserIdAsync(storeId, targetUser.Id, ct);
        if (existingRecord != null)
            throw new InvalidOperationException($"Người dùng '{request.Email}' đã là thành viên của cửa hàng này.");

        // Đảm bảo User có system-level role là "Store"
        var storeRole = await _userRepo.GetRoleByCodeAsync("Store", ct);
        if (storeRole != null)
        {
            var hasStoreRole = await _userRepo.HasUserRoleAsync(targetUser.Id, storeRole.Id, ct);
            if (!hasStoreRole)
            {
                _userRepo.AddUserRole(new UserRole
                {
                    Id = Guid.NewGuid(),
                    UserId = targetUser.Id,
                    RoleId = storeRole.Id
                });
            }
        }

        // Tạo bản ghi StoreStaff với StaffRole = Staff (2)
        var newStaff = new StoreStaff
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            UserId = targetUser.Id,
            StaffRole = (byte)StaffRole.Staff,
            StaffFlags = (byte)StaffFlagsEnum.IsActive,
            JoinedAt = DateTime.UtcNow
        };
        _staffRepo.Add(newStaff);
        await _staffRepo.SaveChangesAsync(ct);

        return new StoreStaffDTO
        {
            UserId = targetUser.Id,
            StoreStaffId = newStaff.Id,
            FullName = targetUser.FullName,
            Email = targetUser.Email,
            AvatarUrl = targetUser.AvatarUrl,
            StaffRole = newStaff.StaffRole,
            StaffRoleLabel = "Staff",
            JoinedAt = newStaff.JoinedAt
        };
    }

    public async Task RemoveStaffAsync(Guid storeId, Guid requestingUserId, Guid targetUserId, CancellationToken ct = default)
    {
        // Validate: chỉ Owner mới được xóa Staff
        var requesterRecord = await _staffRepo.GetByStoreAndUserIdAsync(storeId, requestingUserId, ct);
        if (requesterRecord == null || requesterRecord.StaffRoleEnum != StaffRole.Owner)
            throw new UnauthorizedAccessException("Chỉ Chủ cửa hàng (Owner) mới có quyền xóa nhân viên.");

        // Validate: không thể tự xóa chính mình (Owner)
        if (targetUserId == requestingUserId)
            throw new InvalidOperationException("Chủ cửa hàng không thể tự xóa chính mình.");

        // Tìm bản ghi Staff cần xóa
        var staffRecord = await _staffRepo.GetByStoreAndUserIdAsync(storeId, targetUserId, ct);
        if (staffRecord == null)
            throw new InvalidOperationException("Không tìm thấy nhân viên này trong cửa hàng.");

        // Validate: không thể xóa Owner khác
        if (staffRecord.StaffRoleEnum == StaffRole.Owner)
            throw new InvalidOperationException("Không thể xóa một Chủ cửa hàng khác.");

        _staffRepo.Remove(staffRecord);
        await _staffRepo.SaveChangesAsync(ct);

        // Thu hồi quyền Store nếu User này không còn làm trong bất kỳ cửa hàng nào khác
        var remainingStores = await _staffRepo.CountStoresByUserIdAsync(targetUserId, ct);
        if (remainingStores == 0)
        {
            var storeRole = await _userRepo.GetRoleByCodeAsync("Store", ct);
            if (storeRole != null)
            {
                // Xóa UserRole Store của user này
                // Ta dùng trực tiếp repo user vì IUserRepository không có RemoveUserRole.
                // Thêm method vào UserRepository nếu cần, tạm thời sử dụng workaround
                // thông qua đọc UserRole và remove.
                // NOTE: Đây là pattern an toàn - chỉ thu hồi khi không còn store nào.
                var hasStoreRole = await _userRepo.HasUserRoleAsync(targetUserId, storeRole.Id, ct);
                if (hasStoreRole)
                {
                    await _userRepo.RemoveUserRoleAsync(targetUserId, storeRole.Id, ct);
                    await _userRepo.SaveChangesAsync(ct);
                }
            }
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private static StoreStaffDTO MapToDTO(StoreStaff ss) => new()
    {
        UserId = ss.UserId,
        StoreStaffId = ss.Id,
        FullName = ss.User.FullName,
        Email = ss.User.Email,
        AvatarUrl = ss.User.AvatarUrl,
        StaffRole = ss.StaffRole,
        StaffRoleLabel = ss.StaffRoleEnum == StaffRole.Owner ? "Owner" : "Staff",
        JoinedAt = ss.JoinedAt
    };
}
