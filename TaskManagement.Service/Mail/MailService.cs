using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using TaskManagement.Core.Services;

namespace TaskManagement.Service.Mail;

public class MailService : IMailService
{
    private readonly IConfiguration _configuration;

    public MailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendInvitationEmailAsync(string email, string workspaceName, string token)
    {
        var smtp = new SmtpClient(
            _configuration["Mail:Smtp"],
            int.Parse(_configuration["Mail:Port"]!))
        {
            Credentials = new NetworkCredential(
                _configuration["Mail:Username"],
                _configuration["Mail:Password"]),

            EnableSsl = true
        };

        var link = $"http://localhost:4200/invitation/{token}";

        var mail = new MailMessage
        {
            From = new MailAddress(_configuration["Mail:Username"]!),
            Subject = $"Invitation to {workspaceName}",
            Body =
$"""
You have been invited to join '{workspaceName}'.

Click the link below:

{link}
""",

            IsBodyHtml = false
        };

        mail.To.Add(email);

        await smtp.SendMailAsync(mail);
    }
}