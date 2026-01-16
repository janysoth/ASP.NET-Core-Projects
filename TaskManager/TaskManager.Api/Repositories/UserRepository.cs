using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

public sealed class UserRepository
{
    private readonly IMongoCollection<User> _users;

    public UserRepository(IMongoDatabase db)
    {
        _users = db.GetCollection<User>("users");
    }

    public Task<User?> GetByEmailAsync(string email) =>
        _users.Find(u => u.Email == email).FirstOrDefaultAsync();

    public Task<User?> GetByIdAsync(string id) =>
        _users.Find(u => u.Id == id).FirstOrDefaultAsync();

    public Task<User?> GetByRefreshTokenHashAsync(string tokenHash) =>
        _users.Find(u => u.RefreshTokens.Any(t => t.TokenHash == tokenHash)).FirstOrDefaultAsync();

    public Task CreateAsync(User user) => _users.InsertOneAsync(user);

    public Task UpdateAsync(User user) =>
        _users.ReplaceOneAsync(u => u.Id == user.Id, user);
}
