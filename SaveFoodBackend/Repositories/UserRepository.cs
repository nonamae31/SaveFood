using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Repositories;

public class UserRepository : IUserRepository
{
    private readonly SaveFoodDbContext _ctx;
    private readonly DbSet<User> _set;

    public UserRepository(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
        _set = ctx.Set<User>();
    }

    public async Task<(IEnumerable<User> Items, int TotalCount)> GetAdminUsersAsync(GetUsersRequestDTO request, CancellationToken ct = default)
    {
        var query = _set
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.StoreStaffs)
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
            "fullName" => request.SortDirection == "desc" ? query.OrderByDescending(u => u.FullName).ThenBy(u => u.Id) : query.OrderBy(u => u.FullName).ThenBy(u => u.Id),
            "status" => request.SortDirection == "desc" ? query.OrderByDescending(u => u.Status).ThenBy(u => u.Id) : query.OrderBy(u => u.Status).ThenBy(u => u.Id),
            "createdAt" => request.SortDirection == "desc" ? query.OrderByDescending(u => u.CreatedAt).ThenBy(u => u.Id) : query.OrderBy(u => u.CreatedAt).ThenBy(u => u.Id),
            _ => query.OrderByDescending(u => u.CreatedAt).ThenBy(u => u.Id)
        };

        var totalCount = await query.CountAsync(ct);
        var items = await query.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize).ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<User?> GetAdminUserDetailsAsync(Guid userId, CancellationToken ct = default)
    {
        return await _set
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.StoreStaffs).ThenInclude(ss => ss.Store)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _set.FindAsync(new object[] { id }, ct);
    }

    public async Task<User?> GetByEmailOrNormalizedEmailAsync(string email, string normalizedEmail, CancellationToken ct = default)
    {
        return await _set.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == email, ct);
    }

    public async Task<bool> IsUsernameTakenAsync(string username, CancellationToken ct = default)
    {
        return await _set.AnyAsync(u => u.Username == username, ct);
    }

    public async Task<Role?> GetRoleByCodeAsync(string code, CancellationToken ct = default)
    {
        return await _ctx.Roles.FirstOrDefaultAsync(r => r.Code == code, ct);
    }

    public async Task<bool> HasUserRoleAsync(Guid userId, Guid roleId, CancellationToken ct = default)
    {
        return await _ctx.UserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId, ct);
    }

    public void Add(User user)
    {
        _set.Add(user);
    }

    public void Update(User user)
    {
        _set.Update(user);
    }

    public void AddUserRole(UserRole userRole)
    {
        _ctx.UserRoles.Add(userRole);
    }

    public async Task RemoveUserRoleAsync(Guid userId, Guid roleId, CancellationToken ct = default)
    {
        var userRole = await _ctx.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId, ct);
        if (userRole != null)
        {
            _ctx.UserRoles.Remove(userRole);
        }
    }

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default)
    {
        return await _set
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public void Remove(User user)
    {
        _set.Remove(user);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }
}
