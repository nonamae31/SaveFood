using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services
{
    public class AdminService : IAdminService
    {
        private readonly SaveFoodDbContext _context;

        public AdminService(SaveFoodDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AdminUserListDTO>> GetUsersAsync()
        {
            return await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Select(u => new AdminUserListDTO
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    Status = u.Status,
                    CreatedAt = u.CreatedAt,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<AdminUserDetailsDTO> GetUserDetailsAsync(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.StoreStaffs).ThenInclude(ss => ss.Store)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            return new AdminUserDetailsDTO
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Status = user.Status,
                UserFlags = user.UserFlags,
                CreatedAt = user.CreatedAt,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
                StoreAffiliations = user.StoreStaffs.Select(ss => new AdminStoreStaffInfoDTO
                {
                    StoreId = ss.StoreId,
                    StoreName = ss.Store.Name,
                    AddressLine = ss.Store.AddressLine,
                    StoreStatus = ss.Store.Status,
                    StaffRole = ss.StaffRole
                }).ToList()
            };
        }

        public async Task UpdateUserStatusAsync(Guid userId, byte newStatus)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new InvalidOperationException("User not found.");

            user.Status = newStatus;
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AdminStoreApprovalDTO>> GetPendingStoresAsync()
        {
            var pendingStatus = (byte)StoreStatus.Pending;
            var ownerStaffRole = (byte)StaffRole.Owner;

            return await _context.Stores
                .Where(s => s.Status == pendingStatus)
                .Select(s => new AdminStoreApprovalDTO
                {
                    Id = s.Id,
                    Name = s.Name,
                    AddressLine = s.AddressLine,
                    PhoneNumber = s.PhoneNumber,
                    CreatedAt = s.CreatedAt,
                    OwnerName = s.StoreStaffs.Where(ss => ss.StaffRole == ownerStaffRole).Select(ss => ss.User.FullName).FirstOrDefault(),
                    OwnerEmail = s.StoreStaffs.Where(ss => ss.StaffRole == ownerStaffRole).Select(ss => ss.User.Email).FirstOrDefault()
                })
                .OrderBy(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task ApproveStoreAsync(Guid storeId)
        {
            var store = await _context.Stores
                .Include(s => s.StoreStaffs)
                .FirstOrDefaultAsync(s => s.Id == storeId);

            if (store == null) throw new InvalidOperationException("Store not found.");
            if (store.Status != (byte)StoreStatus.Pending) throw new InvalidOperationException("Store is not in pending status.");

            store.Status = (byte)StoreStatus.Active;
            
            // Set IsVerified flag using bitwise OR
            store.StoreFlags |= (byte)StoreFlagsEnum.IsVerified;

            // Find the owner and grant STORE role globally if they don't have it
            var ownerStaff = store.StoreStaffs.FirstOrDefault(ss => ss.StaffRole == (byte)StaffRole.Owner);
            if (ownerStaff != null)
            {
                var storeRole = await _context.Roles.FirstOrDefaultAsync(r => r.Code == "STORE");
                if (storeRole != null)
                {
                    var hasRole = await _context.UserRoles.AnyAsync(ur => ur.UserId == ownerStaff.UserId && ur.RoleId == storeRole.Id);
                    if (!hasRole)
                    {
                        _context.UserRoles.Add(new UserRole
                        {
                            UserId = ownerStaff.UserId,
                            RoleId = storeRole.Id
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task RejectStoreAsync(Guid storeId, RejectStoreRequest request)
        {
            var store = await _context.Stores.FindAsync(storeId);
            if (store == null) throw new InvalidOperationException("Store not found.");
            if (store.Status != (byte)StoreStatus.Pending) throw new InvalidOperationException("Store is not in pending status.");

            store.Status = (byte)StoreStatus.Rejected;
            store.ReviewNotes = request.ReviewNotes;

            await _context.SaveChangesAsync();
        }
    }
}
