using TaskManager.Api.Dtos;
using TaskManager.Api.Models;
using TaskManager.Api.Repositories;

namespace TaskManager.Api.Services;

public sealed class TodoService
{
  private readonly TodoRepository _repo;

  public TodoService(TodoRepository repo)
  {
    _repo = repo;
  }

  public async Task<List<TodoResponse>> GetAllAsync(string userId)
  {
    var todos = await _repo.GetByUserAsync(userId);

    return todos.Select(ToResponse).ToList();
  }

  public async Task<TodoResponse?> GetByIdAsync(string id, string userId)
  {
    var todo = await _repo.GetByIdAsync(id, userId);
    return todo is null ? null : ToResponse(todo);
  }

  public async Task<TodoResponse> CreateAsync(
      TodoCreateRequest request,
      string userId
  )
  {
    var todo = new Todo
    {
      UserId = userId,
      Title = request.Title,
      Description = request.Description,
      DueDateUtc = request.DueDateUtc,
      CreatedAtUtc = DateTime.UtcNow,
      UpdatedAtUtc = DateTime.UtcNow
    };

    await _repo.CreateAsync(todo);
    return ToResponse(todo);
  }

  public async Task<bool> UpdateAsync(
      string id,
      TodoUpdateRequest request,
      string userId
  )
  {
    var todo = await _repo.GetByIdAsync(id, userId);
    if (todo is null) return false;

    todo.Title = request.Title;
    todo.Description = request.Description;
    todo.IsCompleted = request.IsCompleted;
    todo.DueDateUtc = request.DueDateUtc;
    todo.UpdatedAtUtc = DateTime.UtcNow;

    await _repo.UpdateAsync(todo);
    return true;
  }

  public Task DeleteAsync(string id, string userId)
  {
    return _repo.DeleteAsync(id, userId);
  }

  private static TodoResponse ToResponse(Todo todo) =>
      new(
          todo.Id,
          todo.Title,
          todo.Description,
          todo.IsCompleted,
          todo.DueDateUtc,
          todo.CreatedAtUtc,
          todo.UpdatedAtUtc
      );
}
