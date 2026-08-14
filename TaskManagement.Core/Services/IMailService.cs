namespace TaskManagement.Core.Services;

public interface IMailService
{
    Task SendInvitationEmailAsync(string email, string workspaceName, string token);
}