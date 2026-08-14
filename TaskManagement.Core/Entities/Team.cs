// TaskManagement.Core/Entities/Team.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TaskManagement.Core.Entities;

public class Team
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Description { get; set; }

    // Takımı oluşturan Yöneticinin ID'si
    public int OwnerId { get; set; }

    // Doğrudan Users yerine ara tablo üzerinden bağlıyoruz
    public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}