using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

public class BudgetCategory
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string? Id { get; set; }

  public string UserId { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal PlannedAmount { get; set; }

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}