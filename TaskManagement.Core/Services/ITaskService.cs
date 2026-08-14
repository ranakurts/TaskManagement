using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;

namespace TaskManagement.Core.Services;

public interface ITaskService
{
    // Create
    Task CreateTaskAsync(CreateTaskDto createTaskDto, int userId);

    // Get
    Task<List<TaskResponseDto>> GetAllTasksAsync(int userId);
    Task<DashboardResponseDto> GetDashboardAsync(int userId);
    // ✅ Workspace'e göre görevleri getir
    Task<List<TaskResponseDto>> GetTasksByWorkspaceAsync(int workspaceId);

    // Get By Id
    Task<TaskItem?> GetTaskByIdAsync(int id);

    // Update
    Task UpdateTaskAsync(int id, UpdateTaskDto updateTaskDto);

    // Delete
    Task DeleteTaskAsync(int id);
    Task AddCommentAsync(CreateCommentDto dto, int userId);

    Task<List<CommentResponseDto>> GetCommentsAsync(int taskId);
    Task UploadAttachmentAsync(
    int taskId,
    string fileName,
    string filePath);

    Task<List<AttachmentResponseDto>> GetAttachmentsAsync(int taskId);
}