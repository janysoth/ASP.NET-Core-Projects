using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

public sealed class ExpenseRecord
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string UserId { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string BudgetMonthId { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string AccountId { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string CategoryId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}