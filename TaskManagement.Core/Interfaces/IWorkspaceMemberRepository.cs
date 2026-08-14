using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;

namespace TaskManagement.Core.Interfaces;

public interface IWorkspaceMemberRepository
{
    Task AddAsync(WorkspaceMember member);

    Task<List<TeamMemberDto>> GetMembersByWorkspaceIdAsync(int workspaceId);

    Task<WorkspaceMember?> GetByUserAsync(int workspaceId, int userId);

    Task RemoveAsync(WorkspaceMember member);
    Task DeleteAsync(WorkspaceMember member);
    Task SaveChangesAsync();
}