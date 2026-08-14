using TaskManagement.Core.Enums;

namespace TaskManagement.Core.DTOs;

public class TaskResponseDto
{
    public int Id { get; set; }
    public int? AssignedUserId { get; set; }

    public string AssignedUserName { get; set; } = string.Empty;
    public int UserId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public PriorityLevel Priority { get; set; }

    public TaskItemStatus Status { get; set; }
}