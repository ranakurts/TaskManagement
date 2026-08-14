namespace TaskManagement.Core.Entities;

public class Workspace
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;


    public int OwnerId { get; set; }

    public User Owner { get; set; } = null!;


    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

    public ICollection<WorkspaceMember> Members { get; set; } = new List<WorkspaceMember>();
}