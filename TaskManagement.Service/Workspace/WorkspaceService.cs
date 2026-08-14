using Microsoft.EntityFrameworkCore;
using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Enums;
using TaskManagement.Core.Services;
using TaskManagement.Data.Context;

namespace TaskManagement.Service.Workspaces
{
    public class WorkspaceService : IWorkspaceService
    {
        private readonly ApplicationDbContext _context;

        public WorkspaceService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task CreateWorkspaceAsync(CreateWorkspaceDto dto, int ownerId)
        {
            var workspace = new Workspace
            {
                Name = dto.Name,
                OwnerId = ownerId
            };
            _context.Workspaces.Add(workspace);
            await _context.SaveChangesAsync();

            var ownerMember = new WorkspaceMember
            {
                WorkspaceId = workspace.Id,
                UserId = ownerId,
                Role = WorkspaceRole.Owner,
                JoinedDate = DateTime.UtcNow
            };
            _context.WorkspaceMembers.Add(ownerMember);
            await _context.SaveChangesAsync();
        }

        public async Task<List<WorkspaceResponseDto>> GetUserWorkspacesAsync(int ownerId)
        {
            return await _context.Workspaces
                .Where(w => w.OwnerId == ownerId)
                .Select(w => new WorkspaceResponseDto
                {
                    Id = w.Id,
                    Name = w.Name,
                    OwnerId = w.OwnerId
                })
                .ToListAsync();
        }

        public async Task<List<TeamMemberDto>> GetMembersAsync(int workspaceId)
        {
            return await _context.WorkspaceMembers
                .Where(m => m.WorkspaceId == workspaceId)
                .Include(m => m.User)
                .Select(m => new TeamMemberDto
                {
                    UserId = m.UserId,
                    FullName = m.User != null ? m.User.FullName : "User",
                    Email = m.User != null ? m.User.Email : "",
                    Role = m.Role.ToString(),
                    JoinedDate = m.JoinedDate
                })
                .ToListAsync();
        }

        public async Task InviteMemberAsync(InviteMemberDto dto, int userId)
        {
            var token = Guid.NewGuid().ToString();
            var invitation = new WorkspaceInvitation
            {
                WorkspaceId = dto.WorkspaceId,
                Email = dto.Email.ToLower().Trim(),
                Token = token,
                Status = InvitationStatus.Pending
            };

            _context.WorkspaceInvitations.Add(invitation);
            await _context.SaveChangesAsync();
        }

        public async Task AcceptInvitationAsync(string token)
        {
            var invitation = await _context.WorkspaceInvitations
                .FirstOrDefaultAsync(i => i.Token == token);

            if (invitation == null) throw new Exception("Geçersiz davet token'ı.");

            invitation.Status = InvitationStatus.Accepted;
            _context.WorkspaceInvitations.Update(invitation);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == invitation.Email);
            if (user != null)
            {
                var member = new WorkspaceMember
                {
                    WorkspaceId = invitation.WorkspaceId,
                    UserId = user.Id,
                    Role = WorkspaceRole.Member,
                    JoinedDate = DateTime.UtcNow
                };
                _context.WorkspaceMembers.Add(member);
            }

            await _context.SaveChangesAsync();
        }

        public async Task RejectInvitationAsync(string token)
        {
            var invitation = await _context.WorkspaceInvitations
                .FirstOrDefaultAsync(i => i.Token == token);

            if (invitation == null) return;

            invitation.Status = InvitationStatus.Rejected;
            _context.WorkspaceInvitations.Update(invitation);
            await _context.SaveChangesAsync();
        }

        public async Task<List<InvitationResponseDto>> GetMyInvitationsAsync(string email)
        {
            var normalizedEmail = email.ToLower().Trim();
            return await _context.WorkspaceInvitations
                .Where(i => i.Email == normalizedEmail && i.Status == InvitationStatus.Pending)
                .Include(i => i.Workspace)
                .Select(i => new InvitationResponseDto
                {
                    Token = i.Token,
                    WorkspaceId = i.WorkspaceId,
                    WorkspaceName = i.Workspace != null ? i.Workspace.Name : "Workspace",
                    InvitedAt = DateTime.UtcNow
                })
                .ToListAsync();
        }

        public async Task<bool> RemoveMemberAsync(int workspaceId, int targetUserId, int ownerId)
        {
            var member = await _context.WorkspaceMembers
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == targetUserId);

            if (member == null) return false;

            _context.WorkspaceMembers.Remove(member);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task UpdateWorkspaceAsync(int id, UpdateWorkspaceDto dto)
        {
            var workspace = await _context.Workspaces.FindAsync(id);
            if (workspace != null)
            {
                workspace.Name = dto.Name;
                _context.Workspaces.Update(workspace);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteWorkspaceAsync(int id)
        {
            var workspace = await _context.Workspaces.FindAsync(id);
            if (workspace != null)
            {
                _context.Workspaces.Remove(workspace);
                await _context.SaveChangesAsync();
            }
        }
    }
}