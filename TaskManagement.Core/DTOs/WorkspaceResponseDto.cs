namespace TaskManagement.Core.DTOs
{
    public class WorkspaceResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int OwnerId { get; set; } // <--- BU ALANI EKLEYİN
    }
}