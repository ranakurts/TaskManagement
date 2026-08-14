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

        public async Task<(bool success, string message)> RegisterAsync(RegisterDto dto)
        {
            var normalizedEmail = dto.Email.ToLower().Trim();
            var normalizedUsername = dto.Username.ToLower().Trim();

            var existingUser = await _userRepository.GetByEmailAsync(normalizedEmail);
            if (existingUser != null)
            {
                return (false, "Bu e-posta adresi zaten kayıtlı.");
            }

            var hashedPassword = _passwordService.HashPassword(dto.Password);

            var user = new User
            {
                Username = normalizedUsername,
                FullName = dto.FullName,
                Email = normalizedEmail,
                PasswordHash = hashedPassword
            };

            await _userRepository.AddAsync(user);
            return (true, "Kayıt başarılı.");
        }

        public async Task<string?> LoginAsync(LoginDto dto)
        {
            var input = dto.UsernameOrEmail.ToLower().Trim();
            var user = await _userRepository.GetByEmailAsync(input);

            if (user == null || !_passwordService.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return null;
            }

            return _jwtService.GenerateToken(user);
        }
    }
}