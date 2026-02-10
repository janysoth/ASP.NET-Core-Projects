using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

/// Handles all MongoDB data access for Todo documents.
/// This class isolates MongoDB logic from the rest of the application
/// and enforces the rule that users can only access their own todos.
public sealed class TodoRepository
{
    /// Centralized collection name to avoid magic strings.
    private const string CollectionName = "Todos";

    private readonly IMongoCollection<Todo> _todos;

    /// Initializes the repository with the MongoDB database instance.
    public TodoRepository(IMongoDatabase database)
    {
        _todos = database.GetCollection<Todo>(CollectionName);
    }

    // --------------------------------------------------------------------
    // Reusable MongoDB Filters
    // --------------------------------------------------------------------

    /// Creates a filter that matches all todos for a specific user.
    /// This prevents repeating the same lambda expression everywhere.
    private static FilterDefinition<Todo> UserFilter(string userId) =>
        Builders<Todo>.Filter.Eq(t => t.UserId, userId);

    /// Creates a filter that matches a todo by Id AND UserId.
    /// This guarantees users can never access another user's data.
    private static FilterDefinition<Todo> IdAndUserFilter(string id, string userId) =>
        Builders<Todo>.Filter.And(
            Builders<Todo>.Filter.Eq(t => t.Id, id),
            Builders<Todo>.Filter.Eq(t => t.UserId, userId)
        );

    // --------------------------------------------------------------------
    // Query Methods
    // --------------------------------------------------------------------

    /// Retrieves all todos for a user ordered by newest first.
    public async Task<List<Todo>> GetByUserAsync(string userId)
    {
        var todos = await _todos
            .Find(UserFilter(userId))
            .SortByDescending(t => t.CreatedAtUtc)
            .ToListAsync();

        return todos;
    }

    /// Retrieves a single todo by Id for a specific user.
    /// Returns null if not found.
    /// 
    /// IMPORTANT:
    /// We await here to correctly propagate nullable information
    /// due to MongoDB driver lacking proper nullable annotations.
    public async Task<Todo?> GetByIdAsync(string id, string userId)
    {
        var todo = await _todos
            .Find(IdAndUserFilter(id, userId))
            .FirstOrDefaultAsync();

        return todo;
    }

    // --------------------------------------------------------------------
    // Write Methods
    // --------------------------------------------------------------------

    /// Inserts a new todo document.
    public Task CreateAsync(Todo todo)
    {
        if (todo is null)
            throw new ArgumentNullException(nameof(todo));

        return _todos.InsertOneAsync(todo);
    }

    /// Replaces an existing todo document.
    /// 
    /// Replace is intentionally used instead of Update
    /// to keep the document model simple and predictable.
    /// 
    /// The result allows the caller to verify if the update occurred.
    public async Task<ReplaceOneResult> UpdateAsync(Todo todo)
    {
        if (todo is null)
            throw new ArgumentNullException(nameof(todo));

        var result = await _todos.ReplaceOneAsync(
            IdAndUserFilter(todo.Id, todo.UserId),
            todo
        );

        return result;
    }

    /// Deletes a single todo by Id for a specific user.
    /// The result indicates whether a document was actually removed.
    public Task<DeleteResult> DeleteAsync(string id, string userId)
    {
        return _todos.DeleteOneAsync(
            IdAndUserFilter(id, userId)
        );
    }

    /// Deletes all todos belonging to a user.
    /// Useful when a user account is deleted.
    public Task<DeleteResult> DeleteAllByUserAsync(string userId)
    {
        return _todos.DeleteManyAsync(
            UserFilter(userId)
        );
    }
}
