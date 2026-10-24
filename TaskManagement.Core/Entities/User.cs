using System;
using System.Collections.Generic;

namespace TaskManagement.Core.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        // Ayarlar sayfasındaki "Çalışma Alanı" adı (önceden sadece tarayıcıda tutuluyordu)
        public string? WorkspaceName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ApplicationDbContext'in Fluent API ile bağladığı tüm property'ler:
        public int? TeamId { get; set; }
        public Team? Team { get; set; }

        public ICollection<Workspace> Workspaces { get; set; } = new List<Workspace>();
        public ICollection<WorkspaceMember> WorkspaceMembers { get; set; } = new List<WorkspaceMember>();
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

        // DbContext'in aradığı OwnedWorkspaces ve WorkspaceMemberships bağlantıları:
        public ICollection<Workspace> OwnedWorkspaces { get; set; } = new List<Workspace>();
        public ICollection<WorkspaceMember> WorkspaceMemberships { get; set; } = new List<WorkspaceMember>();
    }
}