using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

public class Bill
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  public string UserId { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string BudgetCategoryId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public bool IsPaid { get; set; }

  public string? ExpenseRecordId { get; set; }

  public DateTime? PaidDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}