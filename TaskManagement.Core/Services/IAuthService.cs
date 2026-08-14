using System.Threading.Tasks;
using TaskManagement.Core.DTOs;

namespace TaskManagement.Core.Services
{
    public interface IAuthService
    {
        Task<(bool success, string message)> RegisterAsync(RegisterDto registerDto);
        Task<string?> LoginAsync(LoginDto loginDto);
    }
}