namespace TaskManagement.Core.DTOs;

public class MemberReportDto
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public int Completed { get; set; }

    public int Active { get; set; }

    public int Todo { get; set; }

    public int High { get; set; }

    public int Medium { get; set; }

    public int Low { get; set; }

    public double CompletionRate { get; set; }
}