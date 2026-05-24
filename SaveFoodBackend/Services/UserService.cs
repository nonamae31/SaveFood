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

        public UserService(SaveFoodDbContext context)
        {
            _context = context;
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
                            .Select(ur => ur.Role.Name)
                            .ToList()
            };
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
            user.Address = request.Address;
            user.AvatarUrl = request.AvatarUrl;

            await _context.SaveChangesAsync();
        }
    }
}
