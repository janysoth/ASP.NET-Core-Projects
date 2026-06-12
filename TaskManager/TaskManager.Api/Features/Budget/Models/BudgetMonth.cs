using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Models;

public class BudgetMonth
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  public string UserId { get; set; } = string.Empty;

  public int Month { get; set; }

  public int Year { get; set; }

  public decimal PlannedIncome { get; set; }

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}