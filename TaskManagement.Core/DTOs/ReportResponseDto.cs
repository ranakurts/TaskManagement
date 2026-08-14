namespace TaskManagement.Core.DTOs;

public class ReportResponseDto
{
    public int TotalTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int ActiveTasks { get; set; }

    public int OverdueTasks { get; set; }

    public double CompletionRate { get; set; }

    public List<MemberReportDto> Members { get; set; } = new();

    public List<WeeklyReportDto> Weekly { get; set; } = new();
}