using TaskManagement.Core.Entities;

namespace TaskManagement.Core.Interfaces;

public interface ITaskRepository
{
    Task AddAsync(TaskItem task);

    Task<List<TaskItem>> GetAllAsync();
    Task<List<TaskItem>> GetByWorkspaceIdAsync(int workspaceId);

    Task<List<TaskItem>> GetByUserIdAsync(int userId);

    Task<TaskItem?> GetByIdAsync(int id);

    Task UpdateAsync(TaskItem task);

    Task DeleteAsync(TaskItem task);
    Task<List<TaskItem>> GetDashboardTasksAsync(int userId);
    Task SaveChangesAsync();
    Task<List<Comment>> GetCommentsAsync(int taskId);

    Task AddCommentAsync(Comment comment);
    Task AddAttachmentAsync(TaskAttachment attachment);

    Task<List<TaskAttachment>> GetAttachmentsAsync(int taskId);
}