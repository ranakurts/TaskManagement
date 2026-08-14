using TaskManagement.Core.Enums;

namespace TaskManagement.Core.DTOs;

public class CreateTaskDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;


    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }


    public PriorityLevel Priority { get; set; }

    public TaskItemStatus Status { get; set; } = TaskItemStatus.Todo;


    public int WorkspaceId { get; set; }


    // Görevin atanacağı kullanıcı
    public int? AssignedUserId { get; set; }
}