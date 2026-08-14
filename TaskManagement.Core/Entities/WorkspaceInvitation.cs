using TaskManagement.Core.Enums;

namespace TaskManagement.Core.Entities;

public class WorkspaceInvitation
{
    public int Id { get; set; }


    public int WorkspaceId { get; set; }

    public Workspace Workspace { get; set; } = null!;


    public string Email { get; set; } = string.Empty;


    public WorkspaceRole Role { get; set; }


    public string Token { get; set; } = Guid.NewGuid().ToString();


    public InvitationStatus Status { get; set; }
        = InvitationStatus.Pending;


    public DateTime ExpireDate { get; set; }
        = DateTime.UtcNow.AddDays(7);


    public DateTime CreatedDate { get; set; }
        = DateTime.UtcNow;
}