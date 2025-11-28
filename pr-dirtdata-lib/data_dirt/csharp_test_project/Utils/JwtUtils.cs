using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using CSharpTestProject.Config;
using CSharpTestProject.Models;

namespace CSharpTestProject.Utils;

public class JwtUtils(JwtConfig jwtConfig)
{
    private readonly JwtSecurityTokenHandler tokenHandler = new();
    private readonly SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(jwtConfig.Secret));

    public string GenerateToken(User user)
    {
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            }),
            Expires = DateTime.UtcNow.AddMinutes(jwtConfig.ExpiryMinutes),
            Issuer = jwtConfig.Issuer,
            Audience = jwtConfig.Audience,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = jwtConfig.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtConfig.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public Guid? GetUserIdFromToken(string token)
    {
        var principal = ValidateToken(token);
        return principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value is { } userIdStr && Guid.TryParse(userIdStr, out var userId) 
            ? userId 
            : null;
    }

    public Role? GetRoleFromToken(string token)
    {
        var principal = ValidateToken(token);
        return principal?.FindFirst(ClaimTypes.Role)?.Value is { } roleStr && Enum.TryParse<Role>(roleStr, out var role) 
            ? role 
            : null;
    }

    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(32);
        var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000);
        var hash = pbkdf2.GetBytes(32);

        var hashBytes = new byte[64];
        salt.CopyTo(hashBytes, 0);
        hash.CopyTo(hashBytes, 32);

        return Convert.ToBase64String(hashBytes);
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        var hashBytes = Convert.FromBase64String(storedHash);
        var salt = new byte[32];
        Array.Copy(hashBytes, 0, salt, 0, 32);

        var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000);
        var hash = pbkdf2.GetBytes(32);

        for (var i = 0; i < 32; i++)
        {
            if (hashBytes[i + 32] != hash[i])
                return false;
        }
        return true;
    }
}