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
  public string? PasswordResetTokenHash { get; set; } = "";
  public DateTime? PasswordResetExpiresAtUtc { get; set; }

  public string? ProfileImageUrl { get; set; }
  public string? Initials { get; set; } = string.Empty;

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

  public List<RefreshTokenRecord> RefreshTokens { get; set; } = new();
}
