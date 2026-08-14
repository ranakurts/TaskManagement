using System;

namespace TaskManagement.Core.DTOs
{
    public class InvitationResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public int WorkspaceId { get; set; }
        public string WorkspaceName { get; set; } = string.Empty;
        public DateTime InvitedAt { get; set; }
    }
}