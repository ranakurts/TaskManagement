using TaskManagement.Core.Enums;

namespace TaskManagement.Core.Entities;

// Takım yöneticisinin (Admin) bir kullanıcıya gönderdiği katılım isteği.
// Davet edilen kişi isteği kabul ederse TeamMember olarak eklenir.
public class TeamInvitation
{
    public int Id { get; set; }

    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public string Email { get; set; } = string.Empty;

    public int InvitedByUserId { get; set; }
    public User InvitedBy { get; set; } = null!;

    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RespondedAt { get; set; }
}
