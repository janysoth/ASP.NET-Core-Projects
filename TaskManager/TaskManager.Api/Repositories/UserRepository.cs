using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

/// <summary>
/// Repository responsible for all User persistence operations.
/// This class encapsulates MongoDB access logic and prevents
/// database concerns from leaking into services or controllers.
/// </summary>
public sealed class UserRepository
{
    // Strongly-typed MongoDB collection for User documents.
    // Each document in this collection represents one user record.
    private readonly IMongoCollection<User> _users;

    /// <summary>
    /// Constructor receives an IMongoDatabase via dependency injection.
    /// This allows the database connection and configuration to be
    /// managed centrally (typically in Program.cs).
    /// </summary>
    public UserRepository(IMongoDatabase db)
    {
        // Retrieves (or creates if missing) the "users" collection.
        // MongoDB collections are schema-less, so no migration is required.
        _users = db.GetCollection<User>("users");
    }

    /// <summary>
    /// Retrieves a user by email address.
    /// Returns null if no matching document exists.
    /// </summary>
    public async Task<User?> GetByEmailAsync(string email)
    {
        // dbUser represents EACH document in the MongoDB "users" collection.
        // This lambda is translated by MongoDB.Driver into a BSON filter:
        // { "Email": "<email>" }
        return await _users
            .Find(dbUser => dbUser.Email == email)
            // FirstOrDefaultAsync returns:
            // - the first matching User document, OR
            // - null if no document matches
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Retrieves a user by unique identifier.
    /// Returns null if the user does not exist.
    /// </summary>
    public async Task<User?> GetByIdAsync(string id)
    {
        // dbUser is the database document being evaluated.
        // The comparison is done server-side in MongoDB.
        return await _users
            .Find(dbUser => dbUser.Id == id)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Retrieves a user that owns the specified refresh token hash.
    /// Used during refresh-token validation and rotation.
    /// Returns null if the token is invalid or revoked.
    /// </summary>
    public async Task<User?> GetByRefreshTokenHashAsync(string tokenHash)
    {
        // dbUser.RefreshTokens.Any(...) is translated into a MongoDB $elemMatch query.
        // MongoDB checks whether ANY element in the RefreshTokens array
        // has a TokenHash equal to the provided value.
        return await _users
            .Find(dbUser =>
                dbUser.RefreshTokens.Any(t => t.TokenHash == tokenHash)
            )
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Inserts a new user document into the database.
    /// MongoDB will generate an _id value automatically if not provided.
    /// </summary>
    public Task CreateAsync(User user)
    {
        // InsertOneAsync persists the entire User object as a new document.
        // This operation will fail if a unique index (e.g., Email) is violated.
        return _users.InsertOneAsync(user);
    }

    /// <summary>
    /// Replaces an existing user document with the provided user object.
    /// The document is identified by its Id.
    /// </summary>
    public Task UpdateAsync(User user)
    {
        // dbUser represents the EXISTING document in MongoDB.
        // user represents the UPDATED object passed into the method.
        //
        // The filter ensures only the document with the matching Id
        // is replaced. Without this filter, the wrong document
        // could be overwritten.
        return _users.ReplaceOneAsync(
            dbUser => dbUser.Id == user.Id,
            user
        );
    }
}
