using TaskManagement.Core.Text;
using System.Threading.Tasks;
using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Interfaces;
using TaskManagement.Core.Services;

namespace TaskManagement.Service.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordService _passwordService;
        private readonly IJwtService _jwtService;

        public AuthService(IUserRepository userRepository, IPasswordService passwordService, IJwtService jwtService)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
            _jwtService = jwtService;
        }

        public async Task<(bool success, string message, string? token)> RegisterAsync(RegisterDto dto)
        {
            var normalizedEmail = TextKey.Normalize(dto.Email);
            var normalizedUsername = TextKey.Normalize(dto.Username);

            if (dto.Password.Length < 6)
            {
                return (false, "Şifre en az 6 karakter olmalıdır.", null);
            }

            if (await _userRepository.GetByEmailAsync(normalizedEmail) != null)
            {
                return (false, "Bu e-posta adresi zaten kayıtlı.", null);
            }

            if (await _userRepository.GetByUsernameAsync(normalizedUsername) != null)
            {
                return (false, "Bu kullanıcı adı zaten alınmış.", null);
            }

            var user = new User
            {
                Username = normalizedUsername,
                FullName = dto.FullName.Trim(),
                Email = normalizedEmail,
                PasswordHash = _passwordService.HashPassword(dto.Password)
            };

            await _userRepository.AddAsync(user);
            // Önceden eksikti: SaveChanges çağrılmadığı için kullanıcı veritabanına hiç yazılmıyordu.
            await _userRepository.SaveChangesAsync();

            return (true, "Kayıt başarılı.", _jwtService.GenerateToken(user));
        }

        public async Task<string?> LoginAsync(LoginDto dto)
        {
            var input = TextKey.Normalize(dto.UsernameOrEmail);
            var user = input.Contains('@')
                ? await _userRepository.GetByEmailAsync(input)
                : await _userRepository.GetByUsernameAsync(input);

            if (user == null || !_passwordService.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return null;
            }

            return _jwtService.GenerateToken(user);
        }
    }
}
