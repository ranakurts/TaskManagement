namespace TaskManagement.Core.DTOs
{
    public class CreateTeamDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class InviteToTeamDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class RespondTeamInvitationDto
    {
        public bool Accept { get; set; }
    }

    public class TeamResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int OwnerId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public string MyRole { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TeamMemberResponseDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
    }

    public class TeamInvitationResponseDto
    {
        public int Id { get; set; }
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string InvitedByName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
