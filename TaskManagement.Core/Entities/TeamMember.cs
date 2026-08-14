// TaskManagement.Core/Entities/TeamMember.cs
using System;

namespace TaskManagement.Core.Entities;

public class TeamMember
{
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // "Admin" veya "Member" değerlerini alacak
    public string Role { get; set; } = "Member";
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}