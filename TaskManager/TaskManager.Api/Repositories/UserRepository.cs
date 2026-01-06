using MongoDB.Driver;
using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

public sealed class UserRepository
{
    private readonly MongoContext _ctx;
    public UserRepository(MongoContext ctx) => _ctx = ctx;

    public Task<User?> GetByEmailAsync(string email) =>
        _ctx.Users.Find(u => u.Email == email.ToLower()).FirstOrDefaultAsync();

    public Task<User?> GetByIdAsync(string id) =>
        _ctx.Users.Find(u => u.Id == id).FirstOrDefaultAsync();

    public Task CreateAsync(User user) => _ctx.Users.InsertOneAsync(user);

    public Task UpdateAsync(User user) =>
        _ctx.Users.ReplaceOneAsync(u => u.Id == user.Id, user);

    public Task<User?> GetByRefreshTokenHashAsync(string tokenHash) =>
     _ctx.Users.Find(u => u.RefreshTokens.Any(t => t.TokenHash == tokenHash))
      .FirstOrDefaultAsync();

}

