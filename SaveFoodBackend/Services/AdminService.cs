using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common;
using SaveFoodBackend.Utils;

namespace SaveFoodBackend.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepo;
        private readonly IStoreRepository _storeRepo;

        public AdminService(IUserRepository userRepo, IStoreRepository storeRepo)
        {
            _userRepo = userRepo;
            _storeRepo = storeRepo;
        }

        public async Task<PaginatedList<AdminUserListDTO>> GetUsersAsync(GetUsersRequestDTO request)
        {
            var (items, totalCount) = await _userRepo.GetAdminUsersAsync(request);

            var mappedQuery = items.Select(u => new AdminUserListDTO
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                Status = u.Status,
                CreatedAt = u.CreatedAt,
                Roles = u.UserRoles.Select(ur => new RoleInfoDTO { Code = ur.Role.Code, Name = ur.Role.Name }).ToList()
            }).ToList();

            return new PaginatedList<AdminUserListDTO>(mappedQuery, totalCount, request.PageNumber, request.PageSize);
        }

        public async Task<AdminUserDetailsDTO> GetUserDetailsAsync(Guid userId)
        {
            var user = await _userRepo.GetAdminUserDetailsAsync(userId);

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
                    DetailedAddress = ss.Store.DetailedAddress,
                    StoreStatus = ss.Store.Status,
                    StaffRole = ss.StaffRole
                }).ToList()
            };
        }

        public async Task UpdateUserStatusAsync(Guid userId, byte newStatus)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null) throw new InvalidOperationException("User not found.");

            user.Status = newStatus;
            await _userRepo.SaveChangesAsync();
        }

        public async Task<IEnumerable<AdminStoreApprovalDTO>> GetPendingStoresAsync()
        {
            return await _storeRepo.GetPendingStoresAsync();
        }

        public async Task ApproveStoreAsync(Guid storeId)
        {
            var store = await _storeRepo.GetStoreWithStaffsAsync(storeId);

            if (store == null) throw new InvalidOperationException("Store not found.");
            if (store.Status != (byte)StoreStatus.Pending) throw new InvalidOperationException("Store is not in pending status.");

            store.Status = (byte)StoreStatus.Active;
            
            // Set IsVerified flag using bitwise OR
            store.StoreFlags |= (byte)StoreFlagsEnum.IsVerified;

            // Find the owner and grant STORE role globally if they don't have it
            var ownerStaff = store.StoreStaffs.FirstOrDefault(ss => ss.StaffRole == (byte)StaffRole.Owner);
            if (ownerStaff != null)
            {
                var storeRole = await _userRepo.GetRoleByCodeAsync("STORE");
                if (storeRole != null)
                {
                    var hasRole = await _userRepo.HasUserRoleAsync(ownerStaff.UserId, storeRole.Id);
                    if (!hasRole)
                    {
                        _userRepo.AddUserRole(new UserRole
                        {
                            UserId = ownerStaff.UserId,
                            RoleId = storeRole.Id
                        });
                    }
                }
            }

            await _storeRepo.SaveChangesAsync();
        }

        public async Task RejectStoreAsync(Guid storeId, RejectStoreRequest request)
        {
            var store = await _storeRepo.GetByIdAsync(storeId);
            if (store == null) throw new InvalidOperationException("Store not found.");
            if (store.Status != (byte)StoreStatus.Pending) throw new InvalidOperationException("Store is not in pending status.");

            store.Status = (byte)StoreStatus.Rejected;
            store.ReviewNotes = request.ReviewNotes;

            await _storeRepo.SaveChangesAsync();
        }

        public async Task AddUserAsync(AddUserRequestDTO request)
        {
            var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
            var existingUser = await _userRepo.GetByEmailOrNormalizedEmailAsync(request.Email, normalizedEmail);
            
            if (existingUser != null)
            {
                throw new InvalidOperationException("Email này đã được sử dụng.");
            }

            var username = request.Email.Split('@')[0];
            username = new string(username.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
            if (username.Length < 3) username = username.PadRight(3, 'a');
            if (username.Length > 20) username = username.Substring(0, 20);

            var isUsernameTaken = await _userRepo.IsUsernameTakenAsync(username);
            if (isUsernameTaken)
            {
                username = username.Substring(0, Math.Min(15, username.Length)) + new Random().Next(1000, 9999).ToString();
            }

            var role = await _userRepo.GetRoleByCodeAsync(request.RoleCode);
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

            _userRepo.Add(newUser);
            await _userRepo.SaveChangesAsync();
        }

        public async Task<PaginatedList<AdminStoreListDTO>> GetStoresAsync(string? search, byte? status, int pageNumber, int pageSize)
        {
            var (items, totalCount) = await _storeRepo.GetAdminStoresAsync(search, status, pageNumber, pageSize);
            return new PaginatedList<AdminStoreListDTO>(items, totalCount, pageNumber, pageSize);
        }

        public async Task<AdminStoreDetailsDTO> GetStoreDetailsAsync(Guid storeId)
        {
            var store = await _storeRepo.GetAdminStoreDetailsAsync(storeId);
            if (store == null) throw new InvalidOperationException("Store not found.");
            return store;
        }

        public async Task UpdateStoreStatusAsync(Guid storeId, byte newStatus)
        {
            var store = await _storeRepo.GetByIdAsync(storeId);
            if (store == null) throw new InvalidOperationException("Store not found.");
            
            store.Status = newStatus;
            await _storeRepo.SaveChangesAsync();
        }
    }
}
