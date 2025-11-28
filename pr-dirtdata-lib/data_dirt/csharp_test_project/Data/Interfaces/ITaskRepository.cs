using CSharpTestProject.Models;

namespace CSharpTestProject.Data.Interfaces;

public interface ITaskRepository
{
    Task<IEnumerable<TaskItem>> GetAllAsync();
    Task<TaskItem?> GetByIdAsync(Guid id);
    Task<IEnumerable<TaskItem>> GetByUserIdAsync(Guid userId);
    Task<TaskItem?> GetByIdAndUserIdAsync(Guid id, Guid userId);
    Task AddAsync(TaskItem task);
    Task UpdateAsync(TaskItem task);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
}