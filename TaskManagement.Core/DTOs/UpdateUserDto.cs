namespace TaskManagement.Core.DTOs
{
    public class UpdateUserDto
    {
        public string? Username { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? WorkspaceName { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}