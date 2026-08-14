namespace TaskManagement.Core.DTOs
{
    public class InviteMemberDto
    {
        public string Email { get; set; } = string.Empty;
        public int WorkspaceId { get; set; }
        // Varsa diğer özelliklerine dokunma, sadece Email'in sonuna = string.Empty; ekle.
    }
}