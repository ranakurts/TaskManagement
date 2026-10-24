using System.Security.Claims;

namespace TaskManagement.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    // Token'daki kullanıcı Id'sini, claim eşlemesi açık ya da kapalı olsa da bulur.
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? user.FindFirst("nameid")?.Value
                    ?? user.FindFirst("sub")?.Value
                    ?? user.FindFirst("id")?.Value;

        return int.TryParse(value, out var id) ? id : null;
    }

    public static string? GetEmail(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Email)?.Value
               ?? user.FindFirst("email")?.Value;
    }
}
