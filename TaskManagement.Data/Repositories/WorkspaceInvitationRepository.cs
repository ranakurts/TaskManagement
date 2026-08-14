using Microsoft.EntityFrameworkCore;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Enums;
using TaskManagement.Core.Interfaces;
using TaskManagement.Data.Context;

public class WorkspaceInvitationRepository : IWorkspaceInvitationRepository
{
    private readonly ApplicationDbContext _context;

    public WorkspaceInvitationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(WorkspaceInvitation invitation)
    {
        await _context.WorkspaceInvitations.AddAsync(invitation);
    }

    public async Task<WorkspaceInvitation?> GetByTokenAsync(string token)
    {
        return await _context.WorkspaceInvitations
            .Include(x => x.Workspace)
            .FirstOrDefaultAsync(x => x.Token == token);
    }

    public async Task<WorkspaceInvitation?> GetPendingInvitationAsync(int workspaceId, string email)
    {
        return await _context.WorkspaceInvitations.FirstOrDefaultAsync(x =>
            x.WorkspaceId == workspaceId &&
            x.Email == email &&
            x.Status == InvitationStatus.Pending);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
    public async Task<List<WorkspaceInvitation>> GetPendingByEmailAsync(string email)
    {
        return await _context.WorkspaceInvitations
            .Include(x => x.Workspace)
            .Where(x => x.Email == email &&
                        x.Status == InvitationStatus.Pending)
            .ToListAsync();
    }
    public async Task UpdateAsync(WorkspaceInvitation invitation)
    {
        _context.WorkspaceInvitations.Update(invitation);
        await Task.CompletedTask;
    }
}