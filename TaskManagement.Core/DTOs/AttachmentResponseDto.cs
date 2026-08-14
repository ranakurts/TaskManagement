namespace TaskManagement.Core.DTOs;

public class AttachmentResponseDto
{
    public int Id { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;
}