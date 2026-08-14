using TaskManagement.Core.Entities;

namespace TaskManagement.Core.Interfaces;

public interface IWorkspaceInvitationRepository
{
    Task AddAsync(WorkspaceInvitation invitation);

    Task<WorkspaceInvitation?> GetByTokenAsync(string token);

    Task<WorkspaceInvitation?> GetPendingInvitationAsync(int workspaceId, string email);

    Task SaveChangesAsync();
    Task<List<WorkspaceInvitation>> GetPendingByEmailAsync(string email);
    Task UpdateAsync(WorkspaceInvitation invitation);
}