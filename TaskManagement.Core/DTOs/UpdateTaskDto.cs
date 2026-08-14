using TaskManagement.Core.Enums;

namespace TaskManagement.Core.DTOs;

public class UpdateTaskDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public PriorityLevel Priority { get; set; }

    public TaskItemStatus Status { get; set; }


    // Görevin atanacağı kişi
    public int? AssignedUserId { get; set; }
}