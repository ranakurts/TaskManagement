namespace TaskManagement.Core.Entities;

public class TaskAttachment
{
    public int Id { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    public int TaskId { get; set; }

    public TaskItem Task { get; set; } = null!;
}