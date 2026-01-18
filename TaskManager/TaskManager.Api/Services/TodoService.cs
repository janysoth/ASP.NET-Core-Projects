using TaskManager.Api.Dtos;
using TaskManager.Api.Models;
using TaskManager.Api.Repositories;

namespace TaskManager.Api.Services;

public sealed class TodoService
{
  private readonly TodoRepository _repo;

  public TodoService(TodoRepository repo) => _repo = repo;

  public async Task<List<TodoResponse>> GetAllAsync(string userId)
  {
    var items = await _repo.GetAllForUserAsync(userId);
    return items.Select(Map).ToList();
  }

  public async Task<TodoResponse> CreateAsync(string userId, TodoCreateRequest req)
  {
    if (string.IsNullOrWhiteSpace(req.Title))
      throw new ArgumentException("Title is required.");

    var now = DateTime.UtcNow;

    var todo = new TodoItem
    {
      UserId = userId,
      Title = req.Title.Trim(),
      Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
      DueDateUtc = req.DueDateUtc,
      CreatedAtUtc = now,
      UpdatedAtUtc = now
    };

    await _repo.CreateAsync(todo);
    return Map(todo);
  }

  public async Task<TodoResponse> UpdateAsync(string userId, string id, TodoUpdateRequest req)
  {
    var existing = await _repo.GetByIdForUserAsync(id, userId);
    if (existing is null)
      throw new KeyNotFoundException("Todo not found.");

    existing.Title = req.Title.Trim();
    existing.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
    existing.IsCompleted = req.IsCompleted;
    existing.DueDateUtc = req.DueDateUtc;
    existing.UpdatedAtUtc = DateTime.UtcNow;

    await _repo.UpdateAsync(existing);
    return Map(existing);
  }

  public Task DeleteAsync(string userId, string id)
      => _repo.DeleteAsync(id, userId);

  private static TodoResponse Map(TodoItem t) =>
      new(t.Id, t.Title, t.Description, t.IsCompleted, t.DueDateUtc, t.CreatedAtUtc, t.UpdatedAtUtc);
}
