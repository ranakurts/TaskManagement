using TaskManagement.Core.Entities;

namespace TaskManagement.Core.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
}