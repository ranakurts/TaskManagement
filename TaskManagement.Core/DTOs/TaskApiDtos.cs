using System.Text.Json.Serialization;
using TaskManagement.Core.Enums;

namespace TaskManagement.Core.DTOs
{
    // Arayüzün kullandığı görev uç noktaları (/api/tasks) için veri modelleri.
    // Tarihler "yyyy-MM-dd" (bitiş/başlangıç) ve UTC ISO (oluşturma/güncelleme) olarak döner.

    public class SaveTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TaskItemStatus Status { get; set; } = TaskItemStatus.Todo;
        public PriorityLevel Priority { get; set; } = PriorityLevel.Medium;
        public string? StartDate { get; set; }
        public string? DueDate { get; set; }
        public int? TeamId { get; set; }
        public int? AssignedUserId { get; set; }
    }

    public class UpdateTaskStatusDto
    {
        public TaskItemStatus Status { get; set; }
    }

    public class TaskItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TaskItemStatus Status { get; set; }
        public PriorityLevel Priority { get; set; }
        public string? StartDate { get; set; }
        public string? DueDate { get; set; }
        public int? TeamId { get; set; }
        public string? TeamName { get; set; }
        public int? AssignedUserId { get; set; }
        public string? AssignedUserName { get; set; }
        public int CreatedById { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int CommentCount { get; set; }
        public bool CanDelete { get; set; }

        // Veritabanından gelen ham tarihler; yanıtta "yyyy-MM-dd" metnine çevrilir
        [JsonIgnore] public DateTime? StartDateValue { get; set; }
        [JsonIgnore] public DateTime? DueDateValue { get; set; }
    }

    public class TaskCommentDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
