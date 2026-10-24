using TaskManagement.Core.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Extensions;
using TaskManagement.Core.DTOs;
using TaskManagement.Core.Services;
using TaskManagement.Data.Context;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordService _passwordService;

        public UsersController(ApplicationDbContext context, IPasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateUserInfo([FromBody] UpdateUserDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null)
            {
                return Unauthorized(new { message = "Geçersiz oturum." });
            }

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı." });
            }

            if (!string.IsNullOrWhiteSpace(dto.Username))
            {
                var username = TextKey.Normalize(dto.Username);
                if (await _context.Users.AnyAsync(u => u.Username == username && u.Id != user.Id))
                {
                    return BadRequest(new { message = "Bu kullanıcı adı zaten alınmış." });
                }
                user.Username = username;
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var email = TextKey.Normalize(dto.Email);
                if (await _context.Users.AnyAsync(u => u.Email == email && u.Id != user.Id))
                {
                    return BadRequest(new { message = "Bu e-posta adresi başka bir hesapta kayıtlı." });
                }
                user.Email = email;
            }

            if (!string.IsNullOrWhiteSpace(dto.FullName))
            {
                user.FullName = dto.FullName.Trim();
            }

            if (dto.WorkspaceName != null)
            {
                var workspace = dto.WorkspaceName.Trim();
                if (workspace.Length > 100)
                {
                    return BadRequest(new { message = "Çalışma alanı adı en fazla 100 karakter olabilir." });
                }
                user.WorkspaceName = workspace.Length == 0 ? null : workspace;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Kullanıcı bilgileri başarıyla güncellendi.",
                user = ToDto(user)
            });
        }

        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null)
            {
                return Unauthorized(new { message = "Geçersiz oturum." });
            }

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı." });
            }

            if (!_passwordService.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Mevcut şifre hatalı." });
            }

            if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Yeni şifre en az 6 karakter olmalıdır." });
            }

            if (dto.NewPassword == dto.CurrentPassword)
            {
                return BadRequest(new { message = "Yeni şifre mevcut şifreden farklı olmalıdır." });
            }

            user.PasswordHash = _passwordService.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şifren başarıyla değiştirildi." });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUserInfo()
        {
            var userId = User.GetUserId();
            if (userId == null)
            {
                return Unauthorized(new { message = "Geçersiz oturum." });
            }

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı." });
            }

            return Ok(ToDto(user));
        }

        private static UserResponseDto ToDto(Core.Entities.User user) => new()
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            WorkspaceName = user.WorkspaceName,
            Avatar = !string.IsNullOrEmpty(user.FullName) ? user.FullName.Substring(0, 1).ToUpper() : "U"
        };
    }
}
