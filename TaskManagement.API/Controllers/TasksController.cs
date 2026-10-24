using System.Globalization;
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
    // Görevler: kişisel ya da bir takıma ait olabilir.
    // Bir görevi; oluşturan kişi, atanan kişi ve (takım görevi ise) takımın tüm üyeleri görür ve düzenler.
    // Silme yetkisi: görevi oluşturan kişi veya takım yöneticisi.
    [ApiController]
    [Route("api/tasks")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private const string DateFormat = "yyyy-MM-dd";

        private readonly ApplicationDbContext _context;

        public TasksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTasks([FromQuery] int? teamId)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var myTeamIds = await MyTeamIdsAsync(userId.Value);

            var query = VisibleTasks(userId.Value, myTeamIds);
            if (teamId.HasValue)
            {
                query = query.Where(t => t.TeamId == teamId.Value);
            }

            var adminTeamIds = await AdminTeamIdsAsync(userId.Value);
            var tasks = await Project(query.OrderByDescending(t => t.CreatedDate)).ToListAsync();
            tasks.ForEach(t => t.CanDelete = t.CreatedById == userId.Value || (t.TeamId.HasValue && adminTeamIds.Contains(t.TeamId.Value)));

            return Ok(tasks.Select(Normalize));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTask(int id)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var dto = await LoadDtoAsync(id, userId.Value);
            return dto == null ? NotFound(new { message = "Görev bulunamadı." }) : Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] SaveTaskDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var error = await ValidateAsync(dto, userId.Value);
            if (error != null) return BadRequest(new { message = error });

            var task = new TaskItem
            {
                UserId = userId.Value,
                CreatedDate = DateTime.UtcNow
            };
            Apply(task, dto);

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return Ok(await LoadDtoAsync(task.Id, userId.Value));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] SaveTaskDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var task = await FindVisibleAsync(id, userId.Value);
            if (task == null) return NotFound(new { message = "Görev bulunamadı." });

            var error = await ValidateAsync(dto, userId.Value);
            if (error != null) return BadRequest(new { message = error });

            Apply(task, dto);
            task.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(await LoadDtoAsync(task.Id, userId.Value));
        }

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTaskStatusDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            if (!Enum.IsDefined(dto.Status)) return BadRequest(new { message = "Geçersiz durum." });

            var task = await FindVisibleAsync(id, userId.Value);
            if (task == null) return NotFound(new { message = "Görev bulunamadı." });

            SetStatus(task, dto.Status);
            task.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(await LoadDtoAsync(task.Id, userId.Value));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var task = await FindVisibleAsync(id, userId.Value);
            if (task == null) return NotFound(new { message = "Görev bulunamadı." });

            var isTeamAdmin = task.TeamId.HasValue && (await AdminTeamIdsAsync(userId.Value)).Contains(task.TeamId.Value);
            if (task.UserId != userId.Value && !isTeamAdmin)
            {
                return StatusCode(403, new { message = "Görevi sadece oluşturan kişi veya takım yöneticisi silebilir." });
            }

            var comments = _context.Comments.Where(c => c.TaskId == task.Id);
            _context.Comments.RemoveRange(comments);
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Görev silindi." });
        }

        // ============================
        // YORUMLAR
        // ============================

        [HttpGet("{id:int}/comments")]
        public async Task<IActionResult> GetComments(int id)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            if (await FindVisibleAsync(id, userId.Value) == null) return NotFound(new { message = "Görev bulunamadı." });

            var comments = await _context.Comments
                .Where(c => c.TaskId == id)
                .OrderBy(c => c.CreatedDate)
                .Select(c => new TaskCommentDto
                {
                    Id = c.Id,
                    Content = c.Content,
                    UserId = c.UserId,
                    UserName = c.User.FullName,
                    CreatedAt = c.CreatedDate
                })
                .ToListAsync();

            comments.ForEach(c => c.CreatedAt = DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc));
            return Ok(comments);
        }

        [HttpPost("{id:int}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var content = dto.Content?.Trim() ?? string.Empty;
            if (content.Length == 0 || content.Length > 2000)
            {
                return BadRequest(new { message = "Yorum 1-2000 karakter arasında olmalıdır." });
            }

            var task = await FindVisibleAsync(id, userId.Value);
            if (task == null) return NotFound(new { message = "Görev bulunamadı." });

            var comment = new Comment
            {
                TaskId = id,
                UserId = userId.Value,
                Content = content,
                CreatedDate = DateTime.UtcNow
            };
            _context.Comments.Add(comment);
            task.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var userName = await _context.Users.Where(u => u.Id == userId.Value).Select(u => u.FullName).FirstAsync();
            return Ok(new TaskCommentDto
            {
                Id = comment.Id,
                Content = comment.Content,
                UserId = comment.UserId,
                UserName = userName,
                CreatedAt = DateTime.SpecifyKind(comment.CreatedDate, DateTimeKind.Utc)
            });
        }

        [HttpDelete("{id:int}/comments/{commentId:int}")]
        public async Task<IActionResult> DeleteComment(int id, int commentId)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Geçersiz oturum." });

            var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == commentId && c.TaskId == id);
            if (comment == null) return NotFound(new { message = "Yorum bulunamadı." });
            if (comment.UserId != userId.Value) return StatusCode(403, new { message = "Sadece kendi yorumunuzu silebilirsiniz." });

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Yorum silindi." });
        }

        // ============================
        // YARDIMCILAR
        // ============================

        private async Task<string?> ValidateAsync(SaveTaskDto dto, int userId)
        {
            var title = dto.Title?.Trim() ?? string.Empty;
            if (title.Length == 0 || title.Length > 200) return "Görev başlığı 1-200 karakter arasında olmalıdır.";
            if ((dto.Description?.Length ?? 0) > 4000) return "Açıklama en fazla 4000 karakter olabilir.";
            if (!Enum.IsDefined(dto.Status)) return "Geçersiz durum.";
            if (!Enum.IsDefined(dto.Priority)) return "Geçersiz öncelik.";

            if (!TryParseDate(dto.StartDate, out var start) || !TryParseDate(dto.DueDate, out var due))
            {
                return "Tarih formatı geçersiz (yyyy-MM-dd).";
            }
            if (start.HasValue && due.HasValue && due < start) return "Bitiş tarihi başlangıçtan önce olamaz.";

            if (dto.TeamId.HasValue)
            {
                var myTeams = await MyTeamIdsAsync(userId);
                if (!myTeams.Contains(dto.TeamId.Value)) return "Bu takımın üyesi değilsiniz.";

                if (dto.AssignedUserId.HasValue &&
                    !await _context.TeamMembers.AnyAsync(tm => tm.TeamId == dto.TeamId && tm.UserId == dto.AssignedUserId))
                {
                    return "Görev sadece takım üyelerine atanabilir.";
                }
            }
            else if (dto.AssignedUserId.HasValue && dto.AssignedUserId != userId)
            {
                return "Kişisel görevler sadece size atanabilir. Başkasına atamak için bir takım seçin.";
            }

            return null;
        }

        private static void Apply(TaskItem task, SaveTaskDto dto)
        {
            TryParseDate(dto.StartDate, out var start);
            TryParseDate(dto.DueDate, out var due);

            task.Title = dto.Title.Trim();
            task.Description = dto.Description?.Trim() ?? string.Empty;
            task.Priority = dto.Priority;
            task.StartDate = start;
            task.EndDate = due;
            task.TeamId = dto.TeamId;
            task.AssignedUserId = dto.AssignedUserId;
            SetStatus(task, dto.Status);
        }

        private static void SetStatus(TaskItem task, TaskItemStatus status)
        {
            if (status == TaskItemStatus.Done && task.Status != TaskItemStatus.Done)
            {
                task.CompletedDate = DateTime.UtcNow;
            }
            else if (status != TaskItemStatus.Done)
            {
                task.CompletedDate = null;
            }
            task.Status = status;
        }

        private static bool TryParseDate(string? value, out DateTime? date)
        {
            date = null;
            if (string.IsNullOrWhiteSpace(value)) return true;
            if (DateTime.TryParseExact(value[..Math.Min(10, value.Length)], DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
            {
                date = d;
                return true;
            }
            return false;
        }

        private IQueryable<TaskItem> VisibleTasks(int userId, List<int> myTeamIds)
        {
            return _context.Tasks.Where(t =>
                t.UserId == userId ||
                t.AssignedUserId == userId ||
                (t.TeamId.HasValue && myTeamIds.Contains(t.TeamId.Value)));
        }

        private async Task<TaskItem?> FindVisibleAsync(int id, int userId)
        {
            var myTeamIds = await MyTeamIdsAsync(userId);
            return await VisibleTasks(userId, myTeamIds).FirstOrDefaultAsync(t => t.Id == id);
        }

        private async Task<TaskItemDto?> LoadDtoAsync(int id, int userId)
        {
            var myTeamIds = await MyTeamIdsAsync(userId);
            var dto = await Project(VisibleTasks(userId, myTeamIds).Where(t => t.Id == id)).FirstOrDefaultAsync();
            if (dto == null) return null;

            var adminTeamIds = await AdminTeamIdsAsync(userId);
            dto.CanDelete = dto.CreatedById == userId || (dto.TeamId.HasValue && adminTeamIds.Contains(dto.TeamId.Value));
            return Normalize(dto);
        }

        private IQueryable<TaskItemDto> Project(IQueryable<TaskItem> query)
        {
            return query.Select(t => new TaskItemDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                StartDateValue = t.StartDate,
                DueDateValue = t.EndDate,
                TeamId = t.TeamId,
                TeamName = t.Team != null ? t.Team.Name : null,
                AssignedUserId = t.AssignedUserId,
                AssignedUserName = t.AssignedUser != null ? t.AssignedUser.FullName : null,
                CreatedById = t.UserId,
                CreatedByName = t.User.FullName,
                CreatedAt = t.CreatedDate,
                UpdatedAt = t.UpdatedDate,
                CompletedAt = t.CompletedDate,
                CommentCount = _context.Comments.Count(c => c.TaskId == t.Id)
            });
        }

        // Gün tarihlerini "yyyy-MM-dd" yapar, zaman damgalarını UTC olarak işaretler
        private static TaskItemDto Normalize(TaskItemDto dto)
        {
            dto.StartDate = dto.StartDateValue?.ToString(DateFormat, CultureInfo.InvariantCulture);
            dto.DueDate = dto.DueDateValue?.ToString(DateFormat, CultureInfo.InvariantCulture);
            dto.CreatedAt = DateTime.SpecifyKind(dto.CreatedAt, DateTimeKind.Utc);
            if (dto.UpdatedAt.HasValue) dto.UpdatedAt = DateTime.SpecifyKind(dto.UpdatedAt.Value, DateTimeKind.Utc);
            if (dto.CompletedAt.HasValue) dto.CompletedAt = DateTime.SpecifyKind(dto.CompletedAt.Value, DateTimeKind.Utc);
            return dto;
        }

        private async Task<List<int>> MyTeamIdsAsync(int userId)
        {
            return await _context.TeamMembers.Where(tm => tm.UserId == userId).Select(tm => tm.TeamId).ToListAsync();
        }

        private async Task<List<int>> AdminTeamIdsAsync(int userId)
        {
            return await _context.TeamMembers
                .Where(tm => tm.UserId == userId && tm.Role == "Admin")
                .Select(tm => tm.TeamId)
                .ToListAsync();
        }
    }
}
