using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Enums;
using TaskManagement.Core.Interfaces;
using TaskManagement.Core.Services;

namespace TaskManagement.Service.Tasks;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;

    public TaskService(ITaskRepository taskRepository)
    {
        _taskRepository = taskRepository;
    }

    // ==========================
    // CREATE
    // ==========================

    public async Task CreateTaskAsync(CreateTaskDto createTaskDto, int userId)
    {
        var task = new TaskItem
        {
            Title = createTaskDto.Title,

            Description = createTaskDto.Description,

            WorkspaceId = createTaskDto.WorkspaceId,

            StartDate = createTaskDto.StartDate,

            EndDate = createTaskDto.EndDate,

            Priority = createTaskDto.Priority,

            Status = createTaskDto.Status,

            // Görevi oluşturan kişi
            UserId = userId,

            // Görevin atandığı kişi
            AssignedUserId = createTaskDto.AssignedUserId,

            CreatedDate = DateTime.UtcNow
        };

        await _taskRepository.AddAsync(task);
        await _taskRepository.SaveChangesAsync();
    }

    // ==========================
    // GET ALL
    // ==========================

    public async Task<List<TaskResponseDto>> GetAllTasksAsync(int userId)
    {
        var tasks = await _taskRepository.GetByUserIdAsync(userId);

        return tasks.Select(task => new TaskResponseDto
        {
            Id = task.Id,

            UserId = task.UserId,
            UserName = task.User?.FullName ?? "",

            AssignedUserId = task.AssignedUserId,
            AssignedUserName = task.AssignedUser?.FullName ?? "",

            Title = task.Title,
            Description = task.Description,
            StartDate = task.StartDate,
            EndDate = task.EndDate,
            Priority = task.Priority,
            Status = task.Status

        }).ToList();
    }

    // ==========================
    // GET BY WORKSPACE
    // ==========================

    public async Task<List<TaskResponseDto>> GetTasksByWorkspaceAsync(int workspaceId)
    {
        var tasks = await _taskRepository.GetByWorkspaceIdAsync(workspaceId);

        return tasks.Select(task => new TaskResponseDto
        {
            Id = task.Id,

            Title = task.Title,

            Description = task.Description,

            StartDate = task.StartDate,

            EndDate = task.EndDate,

            Priority = task.Priority,

            Status = task.Status,


            // Görevi oluşturan kişi
            UserId = task.UserId,

            UserName = task.User?.FullName ?? "",


            // Atanan kişi
            AssignedUserId = task.AssignedUserId,

            AssignedUserName = task.AssignedUser?.FullName ?? ""

        }).ToList();
    }

    // ==========================
    // GET BY ID
    // ==========================

    public async Task<TaskItem?> GetTaskByIdAsync(int id)
    {
        return await _taskRepository.GetByIdAsync(id);
    }

    // ==========================
    // UPDATE
    // ==========================

    public async Task UpdateTaskAsync(int id, UpdateTaskDto updateTaskDto)
    {
        var task = await _taskRepository.GetByIdAsync(id);

        if (task == null)
            return;

        task.Title = updateTaskDto.Title;
        task.AssignedUserId = updateTaskDto.AssignedUserId;
        task.Description = updateTaskDto.Description;
        task.Priority = updateTaskDto.Priority;
        task.Status = updateTaskDto.Status;
        task.StartDate = updateTaskDto.StartDate;
        task.EndDate = updateTaskDto.EndDate;
        task.UpdatedDate = DateTime.UtcNow;

        await _taskRepository.UpdateAsync(task);
        await _taskRepository.SaveChangesAsync();
    }

    // ==========================
    // DELETE
    // ==========================

    public async Task DeleteTaskAsync(int id)
    {
        var task = await _taskRepository.GetByIdAsync(id);

        if (task == null)
            return;

        await _taskRepository.DeleteAsync(task);
        await _taskRepository.SaveChangesAsync();
    }

    // ==========================
    // COMMENTS
    // ==========================

    public async Task AddCommentAsync(CreateCommentDto dto, int userId)
    {
        var comment = new Comment
        {
            Content = dto.Content,
            TaskId = dto.TaskId,
            UserId = userId,
            CreatedDate = DateTime.UtcNow
        };

        await _taskRepository.AddCommentAsync(comment);
        await _taskRepository.SaveChangesAsync();
    }

    public async Task<List<CommentResponseDto>> GetCommentsAsync(int taskId)
    {
        var comments = await _taskRepository.GetCommentsAsync(taskId);

        return comments.Select(x => new CommentResponseDto
        {
            Id = x.Id,
            Content = x.Content,
            UserName = "RK",
            CreatedDate = x.CreatedDate
        }).ToList();
    }

    // ==========================
    // ATTACHMENTS
    // ==========================

    public async Task UploadAttachmentAsync(
        int taskId,
        string fileName,
        string filePath)
    {
        var attachment = new TaskAttachment
        {
            TaskId = taskId,
            FileName = fileName,
            FilePath = filePath,
            UploadDate = DateTime.UtcNow
        };

        await _taskRepository.AddAttachmentAsync(attachment);
        await _taskRepository.SaveChangesAsync();
    }

    public async Task<List<AttachmentResponseDto>> GetAttachmentsAsync(int taskId)
    {
        var files = await _taskRepository.GetAttachmentsAsync(taskId);

        return files.Select(x => new AttachmentResponseDto
        {
            Id = x.Id,
            FileName = x.FileName,
            FilePath = x.FilePath
        }).ToList();
    }

    // ==========================
    // DASHBOARD
    // ==========================

    public async Task<DashboardResponseDto> GetDashboardAsync(int userId)
    {
        var tasks = await _taskRepository.GetDashboardTasksAsync(userId);

        int total = tasks.Count;

        int active = tasks.Count(x => x.Status != TaskItemStatus.Done);

        int completed = tasks.Count(x => x.Status == TaskItemStatus.Done);

        int overdue = tasks.Count(x =>
            x.EndDate < DateTime.UtcNow &&
            x.Status != TaskItemStatus.Done);

        string priority = tasks
            .GroupBy(x => x.Priority)
            .OrderByDescending(x => x.Count())
            .Select(x => x.Key.ToString())
            .FirstOrDefault() ?? "None";

        return new DashboardResponseDto
        {
            TotalTasks = total,

            ActiveTasks = active,

            CompletedTasks = completed,

            OverdueTasks = overdue,

            MostUsedPriority = priority,

            CompletionRate = total == 0
                ? 0
                : Math.Round((double)completed / total * 100, 1)
        };
    }
}