using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.Extensions;
using TaskManagement.Core.DTOs;
using TaskManagement.Core.Services;

namespace TaskManagement.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WorkspaceController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspaceController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateWorkspace(CreateWorkspaceDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var ownerId = User.GetUserId()!.Value;
        await _workspaceService.CreateWorkspaceAsync(dto, ownerId);

        return Ok(new { message = "Workspace created successfully." });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyWorkspaces()
    {
        var ownerId = User.GetUserId()!.Value;
        var workspaces = await _workspaceService.GetUserWorkspacesAsync(ownerId);

        return Ok(workspaces);
    }

    // ============================
    // TEAM MEMBERS
    // ============================

    [HttpGet("{workspaceId}/members")]
    public async Task<IActionResult> GetMembers(int workspaceId)
    {
        var members = await _workspaceService.GetMembersAsync(workspaceId);
        return Ok(members);
    }

    // ============================
    // INVITE MEMBER
    // ============================

    [HttpPost("invite")]
    public async Task<IActionResult> InviteMember(InviteMemberDto dto)
    {
        var userId = User.GetUserId()!.Value;
        await _workspaceService.InviteMemberAsync(dto, userId);

        return Ok(new { message = "Member invited successfully." });
    }

    // ============================
    // UPDATE & DELETE WORKSPACE
    // ============================

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWorkspace(int id, UpdateWorkspaceDto dto)
    {
        await _workspaceService.UpdateWorkspaceAsync(id, dto);
        return Ok(new { message = "Workspace updated successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorkspace(int id)
    {
        await _workspaceService.DeleteWorkspaceAsync(id);
        return Ok(new { message = "Workspace deleted successfully." });
    }

    [HttpDelete("{workspaceId}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(int workspaceId, int userId)
    {
        var ownerId = User.GetUserId()!.Value;
        var result = await _workspaceService.RemoveMemberAsync(workspaceId, userId, ownerId);

        if (!result)
            return BadRequest(new { message = "Member could not be removed." });

        return Ok(new { message = "Member removed successfully." });
    }

    // ============================
    // INVITATION MANAGEMENT (TOKEN)
    // ============================

    [AllowAnonymous]
    [HttpPost("accept/{token}")]
    public async Task<IActionResult> AcceptInvitation(string token)
    {
        try
        {
            await _workspaceService.AcceptInvitationAsync(token);
            return Ok(new { message = "Invitation accepted successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("reject/{token}")]
    public async Task<IActionResult> RejectInvitation(string token)
    {
        await _workspaceService.RejectInvitationAsync(token);
        return Ok(new { message = "Invitation rejected." });
    }

    [HttpGet("my-invitations")]
    public async Task<IActionResult> GetMyInvitations()
    {
        var email = User.GetEmail();

        if (string.IsNullOrEmpty(email))
            return Unauthorized();

        var invitations = await _workspaceService.GetMyInvitationsAsync(email);
        return Ok(invitations);
    }
}