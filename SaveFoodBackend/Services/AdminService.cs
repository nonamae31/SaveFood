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
using SaveFoodBackend.Common;
using SaveFoodBackend.Utils;

namespace SaveFoodBackend.Services
{
    public class AdminService : IAdminService
    {
        private readonly SaveFoodDbContext _context;

        public AdminService(SaveFoodDbContext context)
        {
            _context = context;
        }

        public async Task<PaginatedList<AdminUserListDTO>> GetUsersAsync(GetUsersRequestDTO request)
        {
            var query = _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var search = request.Search.ToLower();
                query = query.Where(u => u.Email.ToLower().Contains(search) || u.FullName.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(request.StatusFilter) && request.StatusFilter != "All")
            {
                if (byte.TryParse(request.StatusFilter, out byte status))
                {
                    query = query.Where(u => u.Status == status);
                }
            }

            if (!string.IsNullOrWhiteSpace(request.RoleFilter) && request.RoleFilter != "All")
            {
                if (request.RoleFilter.Equals("Customer", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(u => !u.UserRoles.Any() || u.UserRoles.Any(ur => ur.Role.Name == "Customer" || ur.Role.Code == "Customer"));
                }
                else
                {
                    query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Code == request.RoleFilter || ur.Role.Name == request.RoleFilter));
                }
            }

            if (request.StaffRoleFilter.HasValue)
            {
                query = query.Where(u => u.StoreStaffs.Any(ss => ss.StaffRole == request.StaffRoleFilter.Value));
            }

            query = request.SortBy switch
            {
                "fullName" => request.SortDirection == "desc" ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
                "status" => request.SortDirection == "desc" ? query.OrderByDescending(u => u.Status) : query.OrderBy(u => u.Status),
                "createdAt" => request.SortDirection == "desc" ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
                _ => query.OrderByDescending(u => u.CreatedAt)
            };

            var mappedQuery = query.Select(u => new AdminUserListDTO
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                Status = u.Status,
                CreatedAt = u.CreatedAt,
                Roles = u.UserRoles.Select(ur => new RoleInfoDTO { Code = ur.Role.Code, Name = ur.Role.Name }).ToList()
            });

            return await PaginatedList<AdminUserListDTO>.CreateAsync(mappedQuery, request.PageNumber, request.PageSize);
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
                Roles = user.UserRoles.Select(ur => new RoleInfoDTO { Code = ur.Role.Code, Name = ur.Role.Name }).ToList(),
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

        public async Task AddUserAsync(AddUserRequestDTO request)
        {
            var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email);
            
            if (existingUser != null)
            {
                throw new InvalidOperationException("Email này đã được sử dụng.");
            }

            var username = request.Email.Split('@')[0];
            username = new string(username.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
            if (username.Length < 3) username = username.PadRight(3, 'a');
            if (username.Length > 20) username = username.Substring(0, 20);

            var isUsernameTaken = await _context.Users.AnyAsync(u => u.Username == username);
            if (isUsernameTaken)
            {
                username = username.Substring(0, Math.Min(15, username.Length)) + new Random().Next(1000, 9999).ToString();
            }

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Code == request.RoleCode);
            if (role == null)
            {
                throw new InvalidOperationException("Role không hợp lệ.");
            }

            var newUser = new Models.User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                NormalizedEmail = normalizedEmail,
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                UserStatusEnum = Models.Enums.UserStatus.Active,
                EmailVerified = true, // Admin created users are pre-verified
                CreatedAt = DateTime.UtcNow
            };

            newUser.UserRoles.Add(new Models.UserRole { RoleId = role.Id, UserId = newUser.Id });

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
        }
    }
}
