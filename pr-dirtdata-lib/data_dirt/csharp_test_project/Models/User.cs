using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CSharpTestProject.Models;

public record class User(Guid Id, required string Username, required string Email, required string PasswordHash, Role Role = Role.User)
{
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    
    [NotMapped]
    public string? Token { get; set; }
}