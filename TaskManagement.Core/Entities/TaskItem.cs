using TaskManagement.Core.Enums;

namespace TaskManagement.Core.Entities;

public class TaskItem
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public PriorityLevel Priority { get; set; }

    public TaskItemStatus Status { get; set; } = TaskItemStatus.Todo;

    public DateTime CreatedDate { get; set; }

    public DateTime? UpdatedDate { get; set; }


    public ICollection<Comment> Comments { get; set; }
        = new List<Comment>();


    // Görevi oluşturan kullanıcı
    public int UserId { get; set; }

    public User User { get; set; } = null!;



    // Görevin atandığı kullanıcı
    public int? AssignedUserId { get; set; }

    public User? AssignedUser { get; set; }



    // Görevin ait olduğu Workspace
    public int WorkspaceId { get; set; }

    public Workspace Workspace { get; set; } = null!;



    public ICollection<TaskAttachment> Attachments { get; set; }
        = new List<TaskAttachment>();
}