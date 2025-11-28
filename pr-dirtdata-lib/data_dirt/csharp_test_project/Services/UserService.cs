using CSharpTestProject.Data.Interfaces;
using CSharpTestProject.Models;
using CSharpTestProject.Services.Interfaces;
using CSharpTestProject.Utils;

namespace CSharpTestProject.Services;

public class UserService(IUserRepository repository, JwtUtils jwtUtils) : IUserService
{
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await repository.GetByIdAsync(id);
    }

    public async Task<User> RegisterAsync(string username, string email, string password, CancellationToken cancellationToken = default)
    {
        if (await repository.ExistsByUsernameAsync(username))
            throw new InvalidOperationException("Username already exists");

        if (await repository.ExistsByEmailAsync(email))
            throw new InvalidOperationException("Email already exists");

        var passwordHash = JwtUtils.HashPassword(password);

        var user = new User(Guid.NewGuid(), username, email, passwordHash);
        await repository.AddAsync(user);
        return user;
    }

    public async Task<string?> LoginAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        var user = await repository.GetByUsernameAsync(username);
        if (user is null || !JwtUtils.VerifyPassword(password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials");

        return jwtUtils.GenerateToken(user);
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        var existing = await repository.GetByIdAsync(user.Id);
        if (existing is null)
            throw new InvalidOperationException("User not found");

        // Pattern matching for role update (only admin can change role, but for demo simple)
        var updatedRole = user.Role switch
        {
            Role.Admin => Role.Admin,
            Role.User => Role.User,
            _ => Role.User
        };

        var updatedUser = existing with { Username = user.Username, Email = user.Email, Role = updatedRole };
        await repository.UpdateAsync(updatedUser);
    }
}