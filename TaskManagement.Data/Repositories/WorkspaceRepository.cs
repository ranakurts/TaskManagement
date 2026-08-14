using Microsoft.EntityFrameworkCore;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Interfaces;
using TaskManagement.Data.Context;

namespace TaskManagement.Data.Repositories;

public class WorkspaceRepository : IWorkspaceRepository
{
    private readonly ApplicationDbContext _context;

    public WorkspaceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Workspace workspace)
    {
        await _context.Workspaces.AddAsync(workspace);
    }

    public async Task<List<Workspace>> GetByOwnerIdAsync(int ownerId)
    {
        return await _context.Workspaces
            .Where(w => w.OwnerId == ownerId)
            .ToListAsync();
    }

    public async Task<Workspace?> GetByIdAsync(int id)
    {
        return await _context.Workspaces.FindAsync(id);
    }

    public Task UpdateAsync(Workspace workspace)
    {
        _context.Workspaces.Update(workspace);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Workspace workspace)
    {
        _context.Workspaces.Remove(workspace);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
    public async Task<List<Workspace>> GetUserWorkspacesAsync(int userId)
    {
        return await _context.WorkspaceMembers
            .Where(m => m.UserId == userId)
            .Include(m => m.Workspace)
            .Select(m => m.Workspace)
            .ToListAsync();
    }
}