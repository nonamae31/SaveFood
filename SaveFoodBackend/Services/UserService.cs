using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.User;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services
{
    public class UserService : IUserService
    {
        private readonly SaveFoodDbContext _context;
        private readonly ICloudinaryService _cloudinaryService;

        public UserService(SaveFoodDbContext context, ICloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<UserProfileDTO> GetProfileAsync(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            var storeStaff = await _context.StoreStaffs.FirstOrDefaultAsync(ss => ss.UserId == userId);

            return new UserProfileDTO
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                AvatarUrl = user.AvatarUrl,
                Roles = user.UserRoles
                            .Where(ur => ur.Role != null)
                            .Select(ur => ur.Role.Code)
                            .ToList(),
                HasPassword = user.PasswordHash != null && !Guid.TryParse(user.PasswordHash, out _),
                StoreId = storeStaff?.StoreId
            };
        }

        public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            bool hasPassword = user.PasswordHash != null && !Guid.TryParse(user.PasswordHash, out _);

            if (hasPassword)
            {
                if (string.IsNullOrEmpty(request.OldPassword))
                {
                    throw new InvalidOperationException("Vui lòng nhập mật khẩu cũ.");
                }

                bool isPasswordValid = false;
                try
                {
                    isPasswordValid = BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash);
                }
                catch (Exception)
                {
                    // Ignore parse errors, validation fails.
                }

                if (!isPasswordValid)
                {
                    throw new InvalidOperationException("Mật khẩu cũ không chính xác.");
                }
            }
            else
            {
                // Nếu chưa có mật khẩu, user không được phép gọi endpoint này. User phải dùng forgot-password và reset-password
                throw new InvalidOperationException("Tài khoản chưa có mật khẩu. Vui lòng sử dụng tính năng gửi OTP để tạo mật khẩu.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            user.FullName = request.FullName;
            user.PhoneNumber = request.PhoneNumber;

            if (request.AvatarFile != null)
            {
                var uploadResult = await _cloudinaryService.UploadImageAsync(request.AvatarFile, user.ImgCloudinaryId);
                if (!string.IsNullOrEmpty(uploadResult.SecureUrl))
                {
                    user.AvatarUrl = uploadResult.SecureUrl;
                    user.ImgCloudinaryId = uploadResult.PublicId;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
