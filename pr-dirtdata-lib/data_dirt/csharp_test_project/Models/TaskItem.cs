using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CSharpTestProject.Models;

public record class TaskItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    
    public required string Title { get; init; }
    
    public string? Description { get; init; }
    
    public TaskStatus Status { get; init; } = TaskStatus.NotStarted;
    
    public Guid UserId { get; init; }
    
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    
    public DateTimeOffset? UpdatedAt { get; init; }
}