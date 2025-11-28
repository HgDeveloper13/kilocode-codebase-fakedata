using CSharpTestProject.Models;

namespace CSharpTestProject.Models.DTOs;

public record CreateTaskDto(required string Title, string? Description, TaskStatus Status = TaskStatus.NotStarted);

public record UpdateTaskDto(required string Title, string? Description, TaskStatus Status);

public record TaskDto(Guid Id, string Title, string? Description, TaskStatus Status, Guid UserId, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);