using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
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
        private readonly IRedisService _redisService;
        private readonly Microsoft.Extensions.DependencyInjection.IServiceScopeFactory _scopeFactory;

        public AdminService(IUserRepository userRepo, IStoreRepository storeRepo, IRedisService redisService, Microsoft.Extensions.DependencyInjection.IServiceScopeFactory scopeFactory)
        {
            _userRepo = userRepo;
            _storeRepo = storeRepo;
            _redisService = redisService;
            _scopeFactory = scopeFactory;
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
            var cacheKey = $"admin:user:{userId}";
            var cachedUser = await _redisService.GetAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedUser))
            {
                return JsonSerializer.Deserialize<AdminUserDetailsDTO>(cachedUser);
            }

            var user = await _userRepo.GetAdminUserDetailsAsync(userId);

            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            var dto = new AdminUserDetailsDTO
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

            await _redisService.SetAsync(cacheKey, JsonSerializer.Serialize(dto), TimeSpan.FromMinutes(10));
            return dto;
        }

        public async Task UpdateUserStatusAsync(Guid userId, byte newStatus)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null) throw new InvalidOperationException("User not found.");

            user.Status = newStatus;
            await _userRepo.SaveChangesAsync();
            await _redisService.DeleteAsync($"admin:user:{userId}");
            await _redisService.DeleteAsync($"profile_v2:{userId}"); // Invalidate profile cache too
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

        public async Task<GlobalSearchResponseDTO> GlobalSearchAsync(string keyword)
        {
            var response = new GlobalSearchResponseDTO();
            if (string.IsNullOrWhiteSpace(keyword)) return response;

            var searchTerm = $"%{keyword}%";

            var usersTask = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SaveFoodBackend.Data.SaveFoodDbContext>();
                return await db.Users
                    .Where(u => EF.Functions.Collate(u.FullName, "Vietnamese_CI_AI").Contains(keyword) || 
                                u.Email.Contains(keyword))
                    .Take(5)
                    .Select(u => new GlobalSearchUserDTO
                    {
                        Id = u.Id,
                        FullName = u.FullName,
                        Email = u.Email,
                        Status = u.Status
                    })
                    .ToListAsync();
            });

            var storesTask = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SaveFoodBackend.Data.SaveFoodDbContext>();
                return await db.Stores
                    .Where(s => EF.Functions.Collate(s.Name, "Vietnamese_CI_AI").Contains(keyword) || 
                                EF.Functions.Collate(s.DetailedAddress, "Vietnamese_CI_AI").Contains(keyword))
                    .Take(5)
                    .Select(s => new GlobalSearchStoreDTO
                    {
                        Id = s.Id,
                        Name = s.Name,
                        AddressLine = s.DetailedAddress,
                        Status = s.Status
                    })
                    .ToListAsync();
            });

            var ordersTask = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SaveFoodBackend.Data.SaveFoodDbContext>();
                var searchKeyword = keyword.ToLower();
                var parsedCode = long.TryParse(keyword, out var code) ? code : (long?)null;

                var orders = await db.Orders
                    .Where(o => 
                        (parsedCode.HasValue && o.OrderCode == parsedCode.Value) ||
                        EF.Functions.Collate(o.Store.Name, "Vietnamese_CI_AI").Contains(keyword) ||
                        (o.User != null && EF.Functions.Collate(o.User.FullName, "Vietnamese_CI_AI").Contains(keyword)) ||
                        db.Payments.Any(p => p.OrderId == o.Id && (
                            (p.PayerName != null && p.PayerName.ToLower().Contains(searchKeyword)) ||
                            (p.PayerAccountNumber != null && p.PayerAccountNumber.ToLower().Contains(searchKeyword)) ||
                            (p.PayerBankId != null && p.PayerBankId.ToLower().Contains(searchKeyword)) ||
                            (p.PayOsReference != null && p.PayOsReference.ToLower().Contains(searchKeyword))
                        ))
                    )
                    .Take(5)
                    .Select(o => new GlobalSearchOrderDTO
                    {
                        Id = o.Id,
                        OrderCode = o.OrderCode,
                        StoreName = o.Store.Name,
                        TotalAmount = o.TotalAmount,
                        Status = (byte)o.OrderStatus
                    })
                    .ToListAsync();

                var subs = await db.StoreSubscriptions
                    .Where(s => 
                        (parsedCode.HasValue && s.OrderCode == parsedCode.Value) ||
                        (s.PayerName != null && s.PayerName.ToLower().Contains(searchKeyword)) ||
                        (s.PayerAccountNumber != null && s.PayerAccountNumber.ToLower().Contains(searchKeyword)) ||
                        (s.PayerBankId != null && s.PayerBankId.ToLower().Contains(searchKeyword)) ||
                        (s.PayOsTransactionId != null && s.PayOsTransactionId.ToLower().Contains(searchKeyword))
                    )
                    .Take(5)
                    .Select(s => new GlobalSearchOrderDTO
                    {
                        Id = s.Id,
                        OrderCode = s.OrderCode,
                        StoreName = s.Store.Name,
                        TotalAmount = s.Plan.MonthlyPrice,
                        Status = s.Status
                    })
                    .ToListAsync();

                return orders.Concat(subs).OrderByDescending(x => x.OrderCode).Take(5).ToList();
            });

            var financeTask = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SaveFoodBackend.Data.SaveFoodDbContext>();
                var searchKeyword = keyword.ToLower();
                var parsedCode = long.TryParse(keyword, out var code) ? code : (long?)null;

                var walletTx = await db.WalletTransactions
                    .Include(w => w.StoreWallet)
                        .ThenInclude(sw => sw.Store)
                    .Where(w => 
                        (parsedCode.HasValue && w.Order != null && w.Order.OrderCode == parsedCode.Value) ||
                        EF.Functions.Collate(w.StoreWallet.Store.Name, "Vietnamese_CI_AI").Contains(keyword) ||
                        (w.Description != null && w.Description.ToLower().Contains(searchKeyword))
                    )
                    .Take(3)
                    .Select(w => new GlobalSearchFinanceDTO
                    {
                        Id = w.Id,
                        Type = "store_wallet_transaction",
                        EntityName = w.StoreWallet.Store.Name,
                        Amount = w.Amount,
                        Status = 1
                    })
                    .ToListAsync();
                    
                var customerTx = await db.CustomerWalletTransactions
                    .Include(w => w.CustomerWallet)
                        .ThenInclude(cw => cw.User)
                    .Where(w => 
                        (parsedCode.HasValue && w.Order != null && w.Order.OrderCode == parsedCode.Value) ||
                        (parsedCode.HasValue && w.PayOsOrderCode == parsedCode.Value) ||
                        EF.Functions.Collate(w.CustomerWallet.User.FullName, "Vietnamese_CI_AI").Contains(keyword) ||
                        (w.Description != null && w.Description.ToLower().Contains(searchKeyword))
                    )
                    .Take(3)
                    .Select(w => new GlobalSearchFinanceDTO
                    {
                        Id = w.Id,
                        Type = "customer_wallet_transaction",
                        EntityName = w.CustomerWallet.User.FullName,
                        Amount = w.Amount,
                        Status = 1
                    })
                    .ToListAsync();

                var withdrawals = await db.WithdrawalRequests
                    .Include(w => w.Store)
                    .Include(w => w.User)
                    .Where(w => 
                        (w.Store != null && EF.Functions.Collate(w.Store.Name, "Vietnamese_CI_AI").Contains(keyword)) ||
                        (w.User != null && EF.Functions.Collate(w.User.FullName, "Vietnamese_CI_AI").Contains(keyword)) ||
                        EF.Functions.Collate(w.BankName, "Vietnamese_CI_AI").Contains(keyword) ||
                        (w.BankAccountNumber != null && w.BankAccountNumber.ToLower().Contains(searchKeyword)) ||
                        EF.Functions.Collate(w.BankAccountName, "Vietnamese_CI_AI").Contains(keyword)
                    )
                    .Take(3)
                    .Select(w => new GlobalSearchFinanceDTO
                    {
                        Id = w.Id,
                        Type = "withdrawal",
                        EntityName = w.Store != null ? w.Store.Name : (w.User != null ? w.User.FullName : "Unknown"),
                        Amount = w.Amount,
                        Status = w.Status
                    })
                    .ToListAsync();

                return walletTx.Concat(customerTx).Concat(withdrawals).Take(5).ToList();
            });

            var categoriesTask = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SaveFoodBackend.Data.SaveFoodDbContext>();
                
                return await db.Categories
                    .Where(c => EF.Functions.Collate(c.Name, "Vietnamese_CI_AI").Contains(keyword))
                    .Take(5)
                    .Select(c => new GlobalSearchCategoryDTO
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Status = c.IsDeleted ? (byte)0 : (byte)1
                    })
                    .ToListAsync();
            });

            await Task.WhenAll(usersTask, storesTask, ordersTask, financeTask, categoriesTask);

            response.Users = await usersTask;
            response.Stores = await storesTask;
            response.Orders = await ordersTask;
            response.Finance = await financeTask;
            response.Categories = await categoriesTask;

            return response;
        }
    }
}
