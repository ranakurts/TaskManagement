using TaskManagement.Core.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Extensions;
using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Enums;
using TaskManagement.Data.Context;

namespace TaskManagement.API.Controllers
{
    // Takımı oluşturan kişi "Admin" olur; yalnızca Admin davet gönderebilir ve üye çıkarabilir.
    // Davet edilen kullanıcıya bekleyen bir istek düşer, kabul ederse "Member" olarak eklenir.
    [ApiController]
    [Route("api/teams")]
    [Authorize]
    public class TeamsController : ControllerBase
    {
        private const string AdminRole = "Admin";
        private const string MemberRole = "Member";

        private readonly ApplicationDbContext _context;

        public TeamsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============================
        // TAKIMLAR
        // ============================

        [HttpPost]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var name = dto.Name?.Trim() ?? string.Empty;
            if (name.Length < 2 || name.Length > 100)
            {
                return BadRequest(new { message = "Takım adı 2-100 karakter arasında olmalıdır." });
            }

            var team = new Team
            {
                Name = name,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                OwnerId = userId.Value
            };
            team.TeamMembers.Add(new TeamMember { UserId = userId.Value, Role = AdminRole });

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Takım oluşturuldu. Artık yöneticisiniz.", teamId = team.Id });
        }

        [HttpGet]
        public async Task<IActionResult> GetMyTeams()
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var teams = await _context.TeamMembers
                .Where(tm => tm.UserId == userId.Value)
                .Select(tm => new TeamResponseDto
                {
                    Id = tm.Team.Id,
                    Name = tm.Team.Name,
                    Description = tm.Team.Description,
                    OwnerId = tm.Team.OwnerId,
                    OwnerName = _context.Users.Where(u => u.Id == tm.Team.OwnerId).Select(u => u.FullName).FirstOrDefault() ?? "",
                    MyRole = tm.Role,
                    MemberCount = tm.Team.TeamMembers.Count,
                    CreatedAt = tm.Team.CreatedAt
                })
                .OrderBy(t => t.Name)
                .ToListAsync();

            return Ok(teams);
        }

        [HttpGet("{teamId:int}/members")]
        public async Task<IActionResult> GetMembers(int teamId)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            if (await GetRoleAsync(teamId, userId.Value) == null)
            {
                return StatusCode(403, new { message = "Bu takımın üyesi değilsiniz." });
            }

            var members = await _context.TeamMembers
                .Where(tm => tm.TeamId == teamId)
                .OrderByDescending(tm => tm.Role == AdminRole)
                .ThenBy(tm => tm.JoinedAt)
                .Select(tm => new TeamMemberResponseDto
                {
                    UserId = tm.UserId,
                    FullName = tm.User.FullName,
                    Username = tm.User.Username,
                    Email = tm.User.Email,
                    Role = tm.Role,
                    JoinedAt = tm.JoinedAt
                })
                .ToListAsync();

            return Ok(members);
        }

        [HttpDelete("{teamId:int}/members/{memberUserId:int}")]
        public async Task<IActionResult> RemoveMember(int teamId, int memberUserId)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            if (await GetRoleAsync(teamId, userId.Value) != AdminRole)
            {
                return StatusCode(403, new { message = "Sadece takım yöneticisi üye çıkarabilir." });
            }

            if (memberUserId == userId.Value)
            {
                return BadRequest(new { message = "Yönetici kendini takımdan çıkaramaz." });
            }

            var member = await _context.TeamMembers.FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == memberUserId);
            if (member == null) return NotFound(new { message = "Üye bulunamadı." });

            _context.TeamMembers.Remove(member);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Üye takımdan çıkarıldı." });
        }

        // ============================
        // DAVETLER (YÖNETİCİ)
        // ============================

        [HttpPost("{teamId:int}/invitations")]
        public async Task<IActionResult> Invite(int teamId, [FromBody] InviteToTeamDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            if (await GetRoleAsync(teamId, userId.Value) != AdminRole)
            {
                return StatusCode(403, new { message = "Sadece takım yöneticisi davet gönderebilir." });
            }

            var email = TextKey.Normalize(dto.Email);
            if (email.Length < 5 || !email.Contains('@'))
            {
                return BadRequest(new { message = "Geçerli bir e-posta adresi girin." });
            }

            var invitedUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (invitedUser == null)
            {
                return BadRequest(new { message = "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı." });
            }

            if (await _context.TeamMembers.AnyAsync(tm => tm.TeamId == teamId && tm.UserId == invitedUser.Id))
            {
                return BadRequest(new { message = "Bu kullanıcı zaten takımda." });
            }

            if (await _context.TeamInvitations.AnyAsync(i => i.TeamId == teamId && i.Email == email && i.Status == InvitationStatus.Pending))
            {
                return BadRequest(new { message = "Bu kullanıcıya zaten bekleyen bir davet gönderilmiş." });
            }

            _context.TeamInvitations.Add(new TeamInvitation
            {
                TeamId = teamId,
                Email = email,
                InvitedByUserId = userId.Value
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Davet {email} adresine gönderildi. Kabul etmesi bekleniyor." });
        }

        [HttpGet("{teamId:int}/invitations")]
        public async Task<IActionResult> GetSentInvitations(int teamId)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            if (await GetRoleAsync(teamId, userId.Value) != AdminRole)
            {
                return StatusCode(403, new { message = "Sadece takım yöneticisi davetleri görebilir." });
            }

            var invitations = await _context.TeamInvitations
                .Where(i => i.TeamId == teamId)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new TeamInvitationResponseDto
                {
                    Id = i.Id,
                    TeamId = i.TeamId,
                    TeamName = i.Team.Name,
                    Email = i.Email,
                    InvitedByName = i.InvitedBy.FullName,
                    Status = i.Status.ToString(),
                    CreatedAt = i.CreatedAt
                })
                .ToListAsync();

            return Ok(invitations);
        }

        [HttpDelete("{teamId:int}/invitations/{invitationId:int}")]
        public async Task<IActionResult> CancelInvitation(int teamId, int invitationId)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            if (await GetRoleAsync(teamId, userId.Value) != AdminRole)
            {
                return StatusCode(403, new { message = "Sadece takım yöneticisi daveti iptal edebilir." });
            }

            var invitation = await _context.TeamInvitations
                .FirstOrDefaultAsync(i => i.Id == invitationId && i.TeamId == teamId && i.Status == InvitationStatus.Pending);
            if (invitation == null) return NotFound(new { message = "Bekleyen davet bulunamadı." });

            _context.TeamInvitations.Remove(invitation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Davet iptal edildi." });
        }

        // ============================
        // DAVETLER (DAVET EDİLEN KULLANICI)
        // ============================

        [HttpGet("invitations/pending")]
        public async Task<IActionResult> GetMyPendingInvitations()
        {
            var email = await GetCurrentEmailAsync();
            if (email == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var invitations = await _context.TeamInvitations
                .Where(i => i.Email == email && i.Status == InvitationStatus.Pending)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new TeamInvitationResponseDto
                {
                    Id = i.Id,
                    TeamId = i.TeamId,
                    TeamName = i.Team.Name,
                    Email = i.Email,
                    InvitedByName = i.InvitedBy.FullName,
                    Status = i.Status.ToString(),
                    CreatedAt = i.CreatedAt
                })
                .ToListAsync();

            return Ok(invitations);
        }

        [HttpPost("invitations/{invitationId:int}/respond")]
        public async Task<IActionResult> Respond(int invitationId, [FromBody] RespondTeamInvitationDto dto)
        {
            var userId = User.GetUserId();
            var email = await GetCurrentEmailAsync();
            if (userId == null || email == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var invitation = await _context.TeamInvitations
                .Include(i => i.Team)
                .FirstOrDefaultAsync(i => i.Id == invitationId);

            if (invitation == null || invitation.Email != email)
            {
                return NotFound(new { message = "Davet bulunamadı." });
            }

            if (invitation.Status != InvitationStatus.Pending)
            {
                return BadRequest(new { message = "Bu davet zaten yanıtlanmış." });
            }

            invitation.Status = dto.Accept ? InvitationStatus.Accepted : InvitationStatus.Rejected;
            invitation.RespondedAt = DateTime.UtcNow;

            if (dto.Accept && !await _context.TeamMembers.AnyAsync(tm => tm.TeamId == invitation.TeamId && tm.UserId == userId.Value))
            {
                _context.TeamMembers.Add(new TeamMember
                {
                    TeamId = invitation.TeamId,
                    UserId = userId.Value,
                    Role = MemberRole
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = dto.Accept
                    ? $"\"{invitation.Team.Name}\" takımına katıldınız."
                    : $"\"{invitation.Team.Name}\" takım daveti reddedildi."
            });
        }

        private async Task<string?> GetRoleAsync(int teamId, int userId)
        {
            return await _context.TeamMembers
                .Where(tm => tm.TeamId == teamId && tm.UserId == userId)
                .Select(tm => tm.Role)
                .FirstOrDefaultAsync();
        }

        // Kullanıcı e-postasını profilinden değiştirmiş olabilir; token yerine veritabanındaki güncel değer esas alınır.
        private async Task<string?> GetCurrentEmailAsync()
        {
            var userId = User.GetUserId();
            if (userId == null) return null;

            return await _context.Users
                .Where(u => u.Id == userId.Value)
                .Select(u => u.Email)
                .FirstOrDefaultAsync();
        }
    }
}
