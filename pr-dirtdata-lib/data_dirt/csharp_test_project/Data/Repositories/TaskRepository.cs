using Microsoft.EntityFrameworkCore;
using CSharpTestProject.Data.Interfaces;
using CSharpTestProject.Data;
using CSharpTestProject.Models;

namespace CSharpTestProject.Data.Repositories;

public class TaskRepository(AppDbContext context) : ITaskRepository
{
    public async Task<IEnumerable<TaskItem>> GetAllAsync()
    {
        return await context.Tasks.ToListAsync();
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id)
    {
        return await context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<TaskItem>> GetByUserIdAsync(Guid userId)
    {
        return await context.Tasks.Where(t => t.UserId == userId).ToListAsync();
    }

    public async Task<TaskItem?> GetByIdAndUserIdAsync(Guid id, Guid userId)
    {
        return await context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
    }

    public async Task AddAsync(TaskItem task)
    {
        await context.Tasks.AddAsync(task);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(TaskItem task)
    {
        context.Tasks.Update(task);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var task = await GetByIdAsync(id);
        if (task is not null)
        {
            context.Tasks.Remove(task);
            await context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await context.Tasks.AnyAsync(t => t.Id == id);
    }
}