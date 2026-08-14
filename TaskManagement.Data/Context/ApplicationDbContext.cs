using Microsoft.EntityFrameworkCore;
using TaskManagement.Core.Entities;

namespace TaskManagement.Data.Context
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Comment> Comments { get; set; }
        public DbSet<TaskAttachment> TaskAttachments { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<Workspace> Workspaces { get; set; }
        public DbSet<WorkspaceMember> WorkspaceMembers { get; set; }
        public DbSet<WorkspaceInvitation> WorkspaceInvitations { get; set; }
        public DbSet<Team> Teams { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============================================================
            // ✅ DÜZELTİLDİ: WorkspaceMember için Composite Primary Key Tanımı
            // ============================================================
            modelBuilder.Entity<WorkspaceMember>()
                .HasKey(wm => new { wm.WorkspaceId, wm.UserId });

            // ============================================================
            // ✅ DÜZELTİLDİ: TeamMember için Composite Primary Key Tanımı
            // Tablo içindeki TeamId ve UserId alanlarını ortak anahtar yapıyoruz
            // ============================================================
            modelBuilder.Entity<TeamMember>()
                .HasKey(tm => new { tm.TeamId, tm.UserId });

            // =============================
            // USER -> TEAM
            // =============================
            modelBuilder.Entity<User>()
                .HasOne(x => x.Team)
                .WithMany() // ✅ Team içinde Users koleksiyonu olmadığı için içi boş bırakıldı
                .HasForeignKey(x => x.TeamId)
                .OnDelete(DeleteBehavior.SetNull);

            // =============================
            // TASK -> ASSIGNED USER
            // =============================
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // =============================
            // WORKSPACE -> OWNER
            // =============================
            modelBuilder.Entity<Workspace>()
                .HasOne(w => w.Owner)
                .WithMany(u => u.OwnedWorkspaces)
                .HasForeignKey(w => w.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            // =============================
            // TASK -> WORKSPACE
            // =============================
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Workspace)
                .WithMany(w => w.Tasks)
                .HasForeignKey(t => t.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // =============================
            // TASK -> USER
            // =============================
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.User)
                .WithMany(u => u.Tasks)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // =============================
            // WORKSPACE MEMBER -> WORKSPACE
            // =============================
            modelBuilder.Entity<WorkspaceMember>()
                .HasOne(wm => wm.Workspace)
                .WithMany(w => w.Members)
                .HasForeignKey(wm => wm.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // =============================
            // WORKSPACE MEMBER -> USER
            // =============================
            modelBuilder.Entity<WorkspaceMember>()
                .HasOne(wm => wm.User)
                .WithMany(u => u.WorkspaceMemberships)
                .HasForeignKey(wm => wm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // =============================
            // INVITATION -> WORKSPACE
            // =============================
            modelBuilder.Entity<WorkspaceInvitation>()
                .HasOne(i => i.Workspace)
                .WithMany()
                .HasForeignKey(i => i.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}