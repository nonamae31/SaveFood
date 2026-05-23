using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services;

public class AuthService : IAuthService
{
    private readonly SaveFoodDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(SaveFoodDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        // 1. Find user by email
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        // 2. Verify password
        bool isPasswordValid = false;
        try
        {
            isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // Fallback to plain text check if DB has plain text passwords (useful during migration)
            isPasswordValid = request.Password == user.PasswordHash;
        }

        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (user.Status != 1) // Assuming 1 is Active
        {
            throw new UnauthorizedAccessException("Account is locked or inactive.");
        }

        // 3. Generate Token
        var token = GenerateJwtToken(user);

        // Extract primary role, or default to empty
        var roleName = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Customer";

        return new LoginResponse
        {
            AccessToken = token,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = roleName
        };
    }

    private string GenerateJwtToken(Models.User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var keyStr = jwtSettings["Key"];
        if (string.IsNullOrEmpty(keyStr)) throw new InvalidOperationException("JWT Key is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName)
        }.ToList();

        // Add roles to claims
        foreach (var userRole in user.UserRoles)
        {
            if (userRole.Role != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
            }
        }

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7), // Token valid for 7 days
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
