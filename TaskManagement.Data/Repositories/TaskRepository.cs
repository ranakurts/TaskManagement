// TaskManagement.Data/Repositories/TaskRepository.cs
using Microsoft.EntityFrameworkCore;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Interfaces;
using TaskManagement.Data.Context;

namespace TaskManagement.Data.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly ApplicationDbContext _context;

        public TaskRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(TaskItem task)
        {
            await _context.Tasks.AddAsync(task);
        }

        public async Task<List<TaskItem>> GetAllAsync()
        {
            return await _context.Tasks.Include(t => t.User).ToListAsync();
        }

        public async Task<List<TaskItem>> GetByUserIdAsync(int userId)
        {
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.AssignedUser)
                .Where(t => t.UserId == userId)
                .ToListAsync();
        }

        public async Task<List<TaskItem>> GetByWorkspaceIdAsync(int workspaceId)
        {
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.AssignedUser)
                .Where(t => t.WorkspaceId == workspaceId)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();
        }

        public async Task<TaskItem?> GetByIdAsync(int id)
        {
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.AssignedUser)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task UpdateAsync(TaskItem task)
        {
            _context.Tasks.Update(task);
            await Task.CompletedTask;
        }

        public async Task DeleteAsync(TaskItem task)
        {
            _context.Tasks.Remove(task);
            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<List<Comment>> GetCommentsAsync(int taskId)
        {
            return await _context.Comments
                .Where(x => x.TaskId == taskId)
                .OrderBy(x => x.CreatedDate)
                .ToListAsync();
        }

        public async Task AddCommentAsync(Comment comment)
        {
            await _context.Comments.AddAsync(comment);
        }

        public async Task AddAttachmentAsync(TaskAttachment attachment)
        {
            await _context.TaskAttachments.AddAsync(attachment);
        }

        // ✅ DÜZELTİLDİ: Gelen 'userId' parametresi sorguya doğru şekilde bağlandı
        public async Task<List<TaskItem>> GetDashboardTasksAsync(int userId)
        {
            return await _context.Tasks
                .Include(t => t.User)
                .Include(t => t.AssignedUser)
                .Where(t => t.UserId == userId || t.AssignedUserId == userId)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();
        }

        // ✅ DÜZELTİLDİ: Metot parametresine uygun olarak 'taskId' alanı filtrelendi
        public async Task<List<TaskAttachment>> GetAttachmentsAsync(int taskId)
        {
            return await _context.TaskAttachments
                .Where(x => x.TaskId == taskId)
                .ToListAsync();
        }
    }
}