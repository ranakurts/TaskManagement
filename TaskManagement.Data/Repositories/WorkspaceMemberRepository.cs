// TaskManagement.Data/Repositories/WorkspaceMemberRepository.cs
using Microsoft.EntityFrameworkCore;
using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Interfaces;
using TaskManagement.Data.Context;

namespace TaskManagement.Data.Repositories
{
    public class WorkspaceMemberRepository : IWorkspaceMemberRepository
    {
        private readonly ApplicationDbContext _context;

        public WorkspaceMemberRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(WorkspaceMember member)
        {
            await _context.WorkspaceMembers.AddAsync(member);
        }

        public async Task<List<TeamMemberDto>> GetMembersByWorkspaceIdAsync(int workspaceId)
        {
            return await _context.WorkspaceMembers
                .Where(x => x.WorkspaceId == workspaceId)
                .Include(x => x.User)
                .Select(x => new TeamMemberDto
                {
                    UserId = x.UserId,
                    FullName = x.User.FullName,
                    Email = x.User.Email,
                    Role = x.Role.ToString(),
                    JoinedDate = x.JoinedDate
                })
                .ToListAsync();
        }

        public async Task<WorkspaceMember?> GetByUserAsync(int workspaceId, int userId)
        {
            return await _context.WorkspaceMembers
                .FirstOrDefaultAsync(x => x.WorkspaceId == workspaceId && x.UserId == userId);
        }

        // ✅ DÜZELTİLDİ: Arayüzün (Interface) beklediği sözleşme ismine (RemoveAsync) geri çekildi
        public async Task RemoveAsync(WorkspaceMember member)
        {
            _context.WorkspaceMembers.Remove(member);
            await Task.CompletedTask;
        }

        // WorkspaceService'in çağırabilmesi için alternatif olarak kalabilir
        public async Task DeleteAsync(WorkspaceMember member)
        {
            await RemoveAsync(member);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}