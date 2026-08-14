namespace TaskManagement.Core.DTOs;

public class CreateCommentDto
{
    public int TaskId { get; set; }

    public string Content { get; set; } = string.Empty;
}