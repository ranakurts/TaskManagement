using TaskManagement.Core.Enums;

namespace TaskManagement.Core.Entities;

public class WorkspaceMember
{
    public int Id { get; set; }


    public int WorkspaceId { get; set; }

    public Workspace Workspace { get; set; } = null!;


    public int UserId { get; set; }

    public User User { get; set; } = null!;


    public WorkspaceRole Role { get; set; }


    public DateTime JoinedDate { get; set; } = DateTime.UtcNow;
}