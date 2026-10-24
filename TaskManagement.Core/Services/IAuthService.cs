using System.Threading.Tasks;
using TaskManagement.Core.DTOs;

namespace TaskManagement.Core.Services
{
    public interface IAuthService
    {
        // Başarılı kayıtta kullanıcının hemen oturum açabilmesi için token da döner.
        Task<(bool success, string message, string? token)> RegisterAsync(RegisterDto registerDto);
        Task<string?> LoginAsync(LoginDto loginDto);
    }
}
