using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;

namespace TaskManagement.Core.Services
{
    public interface IWorkspaceService
    {
        Task CreateWorkspaceAsync(CreateWorkspaceDto dto, int ownerId);
        Task<List<WorkspaceResponseDto>> GetUserWorkspacesAsync(int ownerId);
        Task<List<TeamMemberDto>> GetMembersAsync(int workspaceId);
        Task InviteMemberAsync(InviteMemberDto dto, int userId);
        Task AcceptInvitationAsync(string token);
        Task RejectInvitationAsync(string token);
        Task<List<InvitationResponseDto>> GetMyInvitationsAsync(string email);
        Task<bool> RemoveMemberAsync(int workspaceId, int targetUserId, int ownerId);
        Task UpdateWorkspaceAsync(int id, UpdateWorkspaceDto dto);
        Task DeleteWorkspaceAsync(int id);
    }
}