namespace TaskManagement.Core.DTOs
{
    public class RespondInviteDto
    {
        public string Email { get; set; } = string.Empty;
        public bool Accept { get; set; }
    }
}