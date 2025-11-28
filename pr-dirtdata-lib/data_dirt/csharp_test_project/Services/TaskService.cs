using CSharpTestProject.Data.Interfaces;
using CSharpTestProject.Models;
using CSharpTestProject.Services.Interfaces;

namespace CSharpTestProject.Services;

public class TaskService(ITaskRepository taskRepository, IUserRepository userRepository) : ITaskService
{
    public async Task<IEnumerable<TaskItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await taskRepository.GetAllAsync();
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await taskRepository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<TaskItem>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tasks = await taskRepository.GetByUserIdAsync(userId);
        return tasks.OrderByDescending(t => t.CreatedAt);
    }

    public async Task<TaskItem> CreateAsync(TaskItem task, Guid userId, CancellationToken cancellationToken = default)
    {
        var userExists = await userRepository.ExistsByIdAsync(userId); // Assume ExistsByIdAsync exists or add
        if (!userExists)
            throw new InvalidOperationException("User not found");

        task = task with { UserId = userId, Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow };
        await taskRepository.AddAsync(task);
        return task;
    }

    public async Task<TaskItem> UpdateAsync(Guid id, TaskItem updatedTask, Guid userId, CancellationToken cancellationToken = default)
    {
        var existingTask = await taskRepository.GetByIdAndUserIdAsync(id, userId);
        if (existingTask is null)
            throw new UnauthorizedAccessException("Task not found or not owned by user");

        // Pattern matching for status transition validation
        var newStatus = updatedTask.Status;
        var oldStatus = existingTask.Status;
        var isValidTransition = (oldStatus, newStatus) switch
        {
            (TaskStatus.NotStarted, TaskStatus.NotStarted) => true,
            (TaskStatus.NotStarted, TaskStatus.InProgress) => true,
            (TaskStatus.NotStarted, TaskStatus.Blocked) => true,
            (TaskStatus.NotStarted, TaskStatus.Completed) => true,
            (TaskStatus.InProgress, TaskStatus.InProgress) => true,
            (TaskStatus.InProgress, TaskStatus.Blocked) => true,
            (TaskStatus.InProgress, TaskStatus.Completed) => true,
            (TaskStatus.Blocked, TaskStatus.InProgress) => true,
            (TaskStatus.Blocked, TaskStatus.Completed) => true,
            (TaskStatus.Completed, TaskStatus.Completed) => true,
            _ => false
        };

        if (!isValidTransition)
            throw new InvalidOperationException("Invalid status transition");

        var updated = existingTask with 
        {
            Title = updatedTask.Title,
            Description = updatedTask.Description,
            Status = newStatus,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await taskRepository.UpdateAsync(updated);
        return updated;
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var task = await taskRepository.GetByIdAndUserIdAsync(id, userId);
        if (task is null)
            throw new UnauthorizedAccessException("Task not found or not owned by user");

        await taskRepository.DeleteAsync(id);
    }
}