using System;

namespace TaskManagement.Core.DTOs
{
    public class TeamMemberDto
    {
        // WorkspaceMemberRepository'nin zorunlu olarak aradığı alanlar
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public DateTime JoinedDate { get; set; }

        // Diğer gerekli alanlar
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}