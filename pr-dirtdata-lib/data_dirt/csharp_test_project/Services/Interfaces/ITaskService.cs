using CSharpTestProject.Models;

namespace CSharpTestProject.Services.Interfaces;

public interface ITaskService
{
    Task<IEnumerable<TaskItem>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<TaskItem>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<TaskItem> CreateAsync(TaskItem task, Guid userId, CancellationToken cancellationToken = default);
    Task<TaskItem> UpdateAsync(Guid id, TaskItem updatedTask, Guid userId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken =