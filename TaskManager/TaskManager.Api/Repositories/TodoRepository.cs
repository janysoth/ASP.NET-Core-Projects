using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

/// <summary>
/// Repository responsible for all Todo persistence operations.
/// It ensures that data access logic for Todo items is centralized,
/// consistent, and isolated from business logic.
/// </summary>
public sealed class TodoRepository
{
    // Strongly-typed MongoDB collection for TodoItem documents.
    // Each document represents a single task owned by a specific user.
    private readonly IMongoCollection<TodoItem> _todos;

    /// <summary>
    /// Constructor receives an IMongoDatabase instance via dependency injection.
    /// This allows MongoDB configuration (connection string, database name)
    /// to be managed centrally in Program.cs.
    /// </summary>
    public TodoRepository(IMongoDatabase db)
    {
        // Retrieves (or creates if missing) the "todos" collection.
        // MongoDB collections do not require a predefined schema.
        _todos = db.GetCollection<TodoItem>("todos");
    }

    /// <summary>
    /// Retrieves all Todo items belonging to a specific user.
    /// Results are sorted from newest to oldest.
    /// </summary>
    public async Task<List<TodoItem>> GetAllForUserAsync(string userId)
    {
        // dbTodo represents EACH Todo document stored in MongoDB.
        //
        // Filter:
        //   { "UserId": "<userId>" }
        //
        // Sort:
        //   { "CreatedAtUtc": -1 }
        //
        // Both operations are executed server-side in MongoDB.
        return await _todos
            .Find(dbTodo => dbTodo.UserId == userId)
            .SortByDescending(dbTodo => dbTodo.CreatedAtUtc)
            // ToListAsync returns:
            // - an empty list if no documents match
            // - never null
            .ToListAsync();
    }

    /// <summary>
    /// Retrieves a single Todo item by its Id,
    /// ensuring it belongs to the specified user.
    /// Returns null if:
    /// - the Todo does not exist, OR
    /// - the Todo exists but belongs to a different user
    /// </summary>
    public async Task<TodoItem?> GetByIdForUserAsync(string id, string userId)
    {
        // Combined filter ensures ownership enforcement at the database level.
        // MongoDB translates this to:
        // {
        //   "Id": "<id>",
        //   "UserId": "<userId>"
        // }
        return await _todos
            .Find(dbTodo => dbTodo.Id == id && dbTodo.UserId == userId)
            // FirstOrDefaultAsync returns null if no match is found.
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Inserts a new Todo item into the database.
    /// The Todo must already contain a valid UserId.
    /// </summary>
    public Task CreateAsync(TodoItem todo)
    {
        // InsertOneAsync persists the entire TodoItem object as a new document.
        // MongoDB will automatically generate an _id if not supplied.
        return _todos.InsertOneAsync(todo);
    }

    /// <summary>
    /// Replaces an existing Todo item.
    /// The replacement only occurs if BOTH:
    /// - the Todo Id matches, AND
    /// - the Todo belongs to the same user
    /// </summary>
    public Task UpdateAsync(TodoItem todo)
    {
        // dbTodo represents the EXISTING document in MongoDB.
        // todo represents the UPDATED object passed into this method.
        //
        // This filter prevents one user from updating another user's Todo,
        // even if they somehow know the Todo Id.
        return _todos.ReplaceOneAsync(
            dbTodo => dbTodo.Id == todo.Id && dbTodo.UserId == todo.UserId,
            todo
        );
    }

    /// <summary>
    /// Deletes a Todo item by Id for a specific user.
    /// If no matching document exists, MongoDB performs no action.
    /// </summary>
    public Task DeleteAsync(string id, string userId)
    {
        // DeleteOneAsync removes at most ONE document.
        // The filter ensures user ownership is enforced at the database level.
        return _todos.DeleteOneAsync(
            dbTodo => dbTodo.Id == id && dbTodo.UserId == userId
        );
    }
}
