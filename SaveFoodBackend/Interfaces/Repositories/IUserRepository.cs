using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface IUserRepository
{
    Task<(IEnumerable<User> Items, int TotalCount)> GetAdminUsersAsync(GetUsersRequestDTO request, CancellationToken ct = default);
    Task<User?> GetAdminUserDetailsAsync(Guid userId, CancellationToken ct = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<User?> GetByEmailOrNormalizedEmailAsync(string email, string normalizedEmail, CancellationToken ct = default);
    Task<bool> IsUsernameTakenAsync(string username, CancellationToken ct = default);
    Task<Role?> GetRoleByCodeAsync(string code, CancellationToken ct = default);
    Task<bool> HasUserRoleAsync(Guid userId, Guid roleId, CancellationToken ct = default);
    void Add(User user);
    void Update(User user);
    void AddUserRole(UserRole userRole);
    Task RemoveUserRoleAsync(Guid userId, Guid roleId, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
