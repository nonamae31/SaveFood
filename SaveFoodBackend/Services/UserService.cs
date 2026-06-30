using System;
using System.Linq;
using System.Text.Json;
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
        private readonly IRedisService _redisService;

        public UserService(SaveFoodDbContext context, ICloudinaryService cloudinaryService, IRedisService redisService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
            _redisService = redisService;
        }

        public async Task<UserProfileDTO> GetProfileAsync(Guid userId)
        {
            var cacheKey = $"profile:{userId}";
            var cachedProfile = await _redisService.GetAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedProfile))
            {
                return JsonSerializer.Deserialize<UserProfileDTO>(cachedProfile);
            }
            var user = await _context.Users
                .AsNoTracking()
                .AsSplitQuery()
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            var storeStaff = await _context.StoreStaffs.AsNoTracking().FirstOrDefaultAsync(ss => ss.UserId == userId);

            var profileDto = new UserProfileDTO
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Latitude = user.Latitude,
                Longitude = user.Longitude,
                AvatarUrl = user.AvatarUrl,
                Roles = user.UserRoles
                            .Where(ur => ur.Role != null)
                            .Select(ur => ur.Role.Code)
                            .ToList(),
                HasPassword = user.PasswordHash != null && !Guid.TryParse(user.PasswordHash, out _),
                StoreId = storeStaff?.StoreId,
                StaffRole = storeStaff?.StaffRole,
                Status = user.UserStatusEnum.ToString()
            };

            await _redisService.SetAsync(cacheKey, JsonSerializer.Serialize(profileDto), TimeSpan.FromHours(12));
            return profileDto;
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
            await _redisService.DeleteAsync($"profile:{userId}");
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
            await _redisService.DeleteAsync($"profile:{userId}");
        }

        public async Task UpdateLocationAsync(Guid userId, UpdateLocationRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            user.Latitude = request.Latitude;
            user.Longitude = request.Longitude;
            if (!string.IsNullOrEmpty(request.Address))
            {
                user.Address = request.Address;
            }

            await _context.SaveChangesAsync();
            await _redisService.DeleteAsync($"profile:{userId}");
        }
    }
}
