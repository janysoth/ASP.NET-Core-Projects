using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

public class IncomeRecord
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  public string UserId { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}