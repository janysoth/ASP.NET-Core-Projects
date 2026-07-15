using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

public class RecurringBillTemplate
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  public string UserId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  // The generator finds a category with this name
  // in the target budget month.
  public string CategoryName { get; set; } = string.Empty;

  // Expense or Debt.
  public string CategoryType { get; set; } = "Expense";

  public decimal ExpectedAmount { get; set; }

  // Valid values: 1 through 31.
  public int DueDay { get; set; }

  // Only active templates are used during generation.
  public bool IsActive { get; set; } = true;

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}