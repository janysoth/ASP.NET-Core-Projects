using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Models;

public sealed class TodoItem
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = "";

  [BsonRepresentation(BsonType.ObjectId)]
  public string UserId { get; set; } = "";

  public string Title { get; set; } = "";
  public string? Description { get; set; }
  public bool IsCompleted { get; set; } = false;

  public DateTime? DueDateUtc { get; set; }

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
