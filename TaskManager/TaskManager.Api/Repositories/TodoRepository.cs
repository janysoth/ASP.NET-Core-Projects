using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

public sealed class TodoRepository
{
    private readonly IMongoCollection<Todo> _todos;

    public TodoRepository(IMongoDatabase database)
    {
        _todos = database.GetCollection<Todo>("Todos");
    }

    public Task<List<Todo>> GetByUserAsync(string userId)
    {
        return _todos
            .Find(t => t.UserId == userId)
            .SortByDescending(t => t.CreatedAtUtc)
            .ToListAsync();
    }

    public Task<Todo?> GetByIdAsync(string id, string userId)
    {
        return _todos
            .Find(t => t.Id == id && t.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public Task CreateAsync(Todo todo)
    {
        return _todos.InsertOneAsync(todo);
    }

    public Task UpdateAsync(Todo todo)
    {
        return _todos.ReplaceOneAsync(
            t => t.Id == todo.Id && t.UserId == todo.UserId,
            todo
        );
    }

    public Task DeleteAsync(string id, string userId)
    {
        return _todos.DeleteOneAsync(
            t => t.Id == id && t.UserId == userId
        );
    }
}
