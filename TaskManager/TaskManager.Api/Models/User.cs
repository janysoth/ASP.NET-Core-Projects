using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Models;

public sealed class User
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = "";

  public string FullName { get; set; } = "";
  public string Email { get; set; } = "";
  public string PasswordHash { get; set; } = "";

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

  public List<RefreshTokenRecord> RefreshTokens { get; set; } = new();
}
