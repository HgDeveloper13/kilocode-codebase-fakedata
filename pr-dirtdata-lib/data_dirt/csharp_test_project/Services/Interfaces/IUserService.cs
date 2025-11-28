using CSharpTestProject.Models;

namespace CSharpTestProject.Services.Interfaces;

public interface IUserService
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User> RegisterAsync(string username, string email, string password, CancellationToken cancellationToken = default);
    Task<string?> LoginAsync(string username, string password, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
}