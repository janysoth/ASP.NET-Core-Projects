using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

public sealed class TodoRepository
{
    private readonly IMongoCollection<TodoItem> _todos;

    public TodoRepository(IMongoDatabase db)
    {
        _todos = db.GetCollection<TodoItem>("todos");
    }

    public Task<List<TodoItem>> GetAllForUserAsync(string userId) =>
        _todos.Find(t => t.UserId == userId)
              .SortByDescending(t => t.CreatedAtUtc)
              .ToListAsync();

    public Task<TodoItem?> GetByIdForUserAsync(string id, string userId) =>
        _todos.Find(t => t.Id == id && t.UserId == userId).FirstOrDefaultAsync();

    public Task CreateAsync(TodoItem todo) =>
        _todos.InsertOneAsync(todo);

    public Task UpdateAsync(TodoItem todo) =>
        _todos.ReplaceOneAsync(t => t.Id == todo.Id && t.UserId == todo.UserId, todo);

    public Task DeleteAsync(string id, string userId) =>
        _todos.DeleteOneAsync(t => t.Id == id && t.UserId == userId);
}
