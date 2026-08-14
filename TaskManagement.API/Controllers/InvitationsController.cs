using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagement.Core.DTOs;
using TaskManagement.Core.Entities;
using TaskManagement.Core.Enums;
using TaskManagement.Data.Context;

namespace TaskManagement.API.Controllers
{
    [Authorize]
    [Route("api/invitations")]
    [ApiController]
    public class InvitationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvitationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendInvitation([FromBody] InviteMemberDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? User.FindFirst("sub")?.Value
                              ?? User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int senderId))
            {
                return Unauthorized(new { message = "Geçersiz oturum." });
            }

            var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => w.Id == dto.WorkspaceId || w.OwnerId == senderId);
            if (workspace == null)
            {
                return BadRequest(new { message = "Geçerli bir çalışma alanı bulunamadı." });
            }

            var invitation = new WorkspaceInvitation
            {
                WorkspaceId = workspace.Id,
                Email = dto.Email,
                Status = InvitationStatus.Pending
            };

            _context.WorkspaceInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Çalışma alanı daveti başarıyla gönderildi ve kaydedildi." });
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingInvitations()
        {
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value
                             ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(emailClaim))
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (int.TryParse(userIdClaim, out int uid))
                {
                    var userObj = await _context.Users.FindAsync(uid);
                    emailClaim = userObj?.Email;
                }
            }

            if (string.IsNullOrEmpty(emailClaim))
            {
                return BadRequest(new { message = "Kullanıcı e-postası doğrulanamadı." });
            }

            var pendingInvs = await _context.WorkspaceInvitations
                .Include(i => i.Workspace)
                .Where(i => i.Email == emailClaim && i.Status == InvitationStatus.Pending)
                .ToListAsync();

            return Ok(pendingInvs);
        }

        [HttpPost("respond")]
        public async Task<IActionResult> RespondInvitation([FromBody] RespondInviteDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? User.FindFirst("sub")?.Value
                              ?? User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Geçersiz oturum." });
            }

            // DTO içindeki olası Property isim uyumsuzluğunu önlemek için dto.Id veya dto.InvitationId kontrolü
            int invitationId = 0;
            try { invitationId = (int)(dto.GetType().GetProperty("InvitationId")?.GetValue(dto) ?? dto.GetType().GetProperty("Id")?.GetValue(dto) ?? 0); } catch { }

            if (invitationId == 0)
            {
                return BadRequest(new { message = "Geçersiz davet ID formatı." });
            }

            var invitation = await _context.WorkspaceInvitations.FindAsync(invitationId);
            if (invitation == null)
            {
                return NotFound(new { message = "Davet bulunamadı." });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null || user.Email != invitation.Email)
            {
                return Forbid(); // Büyük harfle düzeltildi
            }

            // Accept property kontrolü (Accept veya IsAccepted olabilir)
            bool isAccepted = true;
            try { isAccepted = (bool)(dto.GetType().GetProperty("Accept")?.GetValue(dto) ?? dto.GetType().GetProperty("IsAccepted")?.GetValue(dto) ?? true); } catch { }

            if (isAccepted)
            {
                invitation.Status = InvitationStatus.Accepted;

                bool alreadyMember = await _context.WorkspaceMembers
                    .AnyAsync(wm => wm.WorkspaceId == invitation.WorkspaceId && wm.UserId == userId);

                if (!alreadyMember)
                {
                    _context.WorkspaceMembers.Add(new WorkspaceMember
                    {
                        WorkspaceId = invitation.WorkspaceId,
                        UserId = userId
                    });
                }
            }
            else
            {
                invitation.Status = InvitationStatus.Rejected;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = isAccepted ? "Davet kabul edildi, çalışma alanına eklendiniz." : "Davet reddedildi." });
        }
    }
}