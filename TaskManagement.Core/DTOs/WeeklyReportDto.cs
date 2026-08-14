namespace TaskManagement.Core.DTOs;

public class WeeklyReportDto
{
    public string Day { get; set; } = string.Empty;

    public int Completed { get; set; }
}