namespace TaskManagement.Core.DTOs;

public class CommentResponseDto
{
    public int Id { get; set; }

    public string Content { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public DateTime CreatedDate { get; set; }
}