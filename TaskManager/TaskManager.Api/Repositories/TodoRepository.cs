using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

public sealed class TodoRepository
{
  private readonly MongoContext _ctx;
  public TodoRepository(MongoContext ctx) => _ctx = ctx;

  public Task<List<TodoItem>> GetAllForUserAsync(string userId) =>
      _ctx.Todos.Find(t => t.UserId == userId)
          .SortByDescending(t => t.CreatedAtUtc)
          .ToListAsync();

  public Task<TodoItem?> GetByIdForUserAsync(string id, string userId) =>
      _ctx.Todos.Find(t => t.Id == id && t.UserId == userId).FirstOrDefaultAsync();

  public Task CreateAsync(TodoItem todo) => _ctx.Todos.InsertOneAsync(todo);

  public Task UpdateAsync(TodoItem todo) =>
      _ctx.Todos.ReplaceOneAsync(t => t.Id == todo.Id && t.UserId == todo.UserId, todo);

  public Task DeleteAsync(string id, string userId) =>
      _ctx.Todos.DeleteOneAsync(t => t.Id == id && t.UserId == userId);
}
