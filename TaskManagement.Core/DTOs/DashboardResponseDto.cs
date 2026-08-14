namespace TaskManagement.Core.DTOs;

public class DashboardResponseDto
{
    public int TotalTasks { get; set; }

    public int ActiveTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int OverdueTasks { get; set; }

    public double CompletionRate { get; set; }

    public string MostUsedPriority { get; set; } = string.Empty;
}