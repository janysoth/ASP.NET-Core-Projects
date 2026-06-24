using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

public class FinancialAccount
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  public string UserId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  // Allowed values: Checking, Savings, CreditCard
  public string Type { get; set; } = "Checking";

  public decimal StartingBalance { get; set; }

  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}