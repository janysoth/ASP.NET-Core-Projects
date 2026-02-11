using System.Linq.Expressions;
using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

/// Provides all MongoDB data access for Todo documents.
/// 
/// This repository supports:
/// • Reading todos
/// • Full document replacement (Replace)
/// • Safe partial updates (Patch a single field)
/// • Deletions
/// 
/// It also enforces the rule that users can only access their own todos
/// by always filtering on both Id and UserId.
public sealed class TodoRepository
{
    /// Centralized collection name to avoid magic strings.
    private const string CollectionName = "Todos";

    private readonly IMongoCollection<Todo> _todos;

    public TodoRepository(IMongoDatabase database)
    {
        _todos = database.GetCollection<Todo>(CollectionName);
    }

    // --------------------------------------------------------------------
    // MongoDB Filters (reused across all operations)
    // --------------------------------------------------------------------

    /// Filter to match all todos for a specific user.
    private static FilterDefinition<Todo> UserFilter(string userId) =>
        Builders<Todo>.Filter.Eq(t => t.UserId, userId);

    /// Filter to match a todo by Id AND UserId.
    /// This guarantees users cannot access another user's data.
    private static FilterDefinition<Todo> IdAndUserFilter(string id, string userId) =>
        Builders<Todo>.Filter.And(
            Builders<Todo>.Filter.Eq(t => t.Id, id),
            Builders<Todo>.Filter.Eq(t => t.UserId, userId)
        );

    // --------------------------------------------------------------------
    // Query Methods
    // --------------------------------------------------------------------

    /// Returns all todos for a user ordered by newest first.
    public async Task<List<Todo>> GetByUserAsync(string userId)
    {
        var todos = await _todos
            .Find(UserFilter(userId))
            .SortByDescending(t => t.CreatedAtUtc)
            .ToListAsync();

        return todos;
    }

    /// Returns a single todo by Id for a specific user.
    /// Returns null if not found.
    public async Task<Todo?> GetByIdAsync(string id, string userId)
    {
        var todo = await _todos
            .Find(IdAndUserFilter(id, userId))
            .FirstOrDefaultAsync();

        return todo;
    }

    // --------------------------------------------------------------------
    // Create
    // --------------------------------------------------------------------

    /// Inserts a new todo document.
    public Task CreateAsync(Todo todo)
    {
        if (todo is null)
            throw new ArgumentNullException(nameof(todo));

        return _todos.InsertOneAsync(todo);
    }

    // --------------------------------------------------------------------
    // Full Document Replace
    // --------------------------------------------------------------------

    /// Replaces the ENTIRE todo document.
    /// 
    /// Use this ONLY when you previously fetched the full document
    /// and modified it in memory.
    public Task<ReplaceOneResult> UpdateAsync(Todo todo)
    {
        if (todo is null)
            throw new ArgumentNullException(nameof(todo));

        return _todos.ReplaceOneAsync(
            IdAndUserFilter(todo.Id, todo.UserId),
            todo
        );
    }

    // --------------------------------------------------------------------
    // Generic Patch (Safe Partial Update)
    // --------------------------------------------------------------------

    /// Updates a single field on the todo using MongoDB $set.
    /// 
    /// The field is provided as a strongly-typed expression,
    /// which makes this method compile-time safe and refactor-safe.
    /// 
    /// Example:
    /// await PatchFieldAsync(id, userId, t => t.Title, "New title");
    public Task<UpdateResult> PatchUpdateAsync<TField>(
        string id,
        string userId,
        Expression<Func<Todo, TField>> field,
        TField value)
    {
        var update = Builders<Todo>.Update.Set(field, value);

        return _todos.UpdateOneAsync(
            IdAndUserFilter(id, userId),
            update
        );
    }

    // --------------------------------------------------------------------
    // Delete Methods
    // --------------------------------------------------------------------

    /// Deletes a single todo by Id for a user.
    public Task<DeleteResult> DeleteAsync(string id, string userId)
    {
        return _todos.DeleteOneAsync(
            IdAndUserFilter(id, userId)
        );
    }

    /// Deletes all todos belonging to a user.
    /// Useful when a user account is removed.
    public Task<DeleteResult> DeleteAllByUserAsync(string userId)
    {
        return _todos.DeleteManyAsync(
            UserFilter(userId)
        );
    }
}
