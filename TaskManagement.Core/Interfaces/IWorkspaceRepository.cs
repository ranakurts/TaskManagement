using TaskManagement.Core.Entities;

namespace TaskManagement.Core.Interfaces;

public interface IWorkspaceRepository
{
    Task AddAsync(Workspace workspace);

    Task<List<Workspace>> GetByOwnerIdAsync(int ownerId);

    Task<Workspace?> GetByIdAsync(int id);

    Task UpdateAsync(Workspace workspace);

    Task DeleteAsync(Workspace workspace);

    Task SaveChangesAsync();
    Task<List<Workspace>> GetUserWorkspacesAsync(int userId);
}