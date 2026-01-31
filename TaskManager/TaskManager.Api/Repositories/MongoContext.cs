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

    // MongoClient is thread-safe; creating once per context is fine
    var client = new MongoClient(s.ConnectionString);

    _db = client.GetDatabase(s.DatabaseName);
  }

  // users collection
  public IMongoCollection<User> Users =>
      _db.GetCollection<User>("users");

  // todos collection (FIXED)
  public IMongoCollection<Todo> Todos =>
      _db.GetCollection<Todo>("todos");
}
