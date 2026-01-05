using Microsoft.Extensions.Options;
using MongoDB.Driver;
using TaskManager.Api.Models;
using TaskManager.Api.Settings;

namespace TaskManager.Api.Repositories;

public sealed class MongoContext
{
  private readonly IMongoDatabase _db;

  public MongoContext(IOptions<MongoDbSettings> options)
  {
    var s = options.Value;
    var client = new MongoClient(s.ConnectionString);
    _db = client.GetDatabase(s.DatabaseName);
  }

  public IMongoCollection<User> Users => _db.GetCollection<User>("users");
  public IMongoCollection<TodoItem> Todos => _db.GetCollection<TodoItem>("todos");
}
