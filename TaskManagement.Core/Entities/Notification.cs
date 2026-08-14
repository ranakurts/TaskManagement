namespace TaskManagement.Core.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public string? RecipientEmail { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}