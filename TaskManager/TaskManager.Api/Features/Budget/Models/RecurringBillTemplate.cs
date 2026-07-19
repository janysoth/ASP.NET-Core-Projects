using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

public class RecurringBillTemplate
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  public string UserId { get; set; } = string.Empty;

  /*===========================================================
    PaymentType:
    => Expense creates a regular expense bill.
    => Transfer creates a credit-card payment bill.
  ===========================================================*/
  public string PaymentType { get; set; } =
    BillPaymentTypes.Expense;

  /*===========================================================
    CategoryName:
    => Used only for Expense templates.
    => Finds the matching Expense category in the target month.
  ===========================================================*/
  [BsonIgnoreIfNull]
  public string? CategoryName { get; set; }

  /*===========================================================
    DestinationAccountId:
    => Used only for Transfer templates.
    => Must reference a CreditCard account.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? DestinationAccountId { get; set; }

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  // Valid values: 1 through 31.
  public int DueDay { get; set; }

  public bool IsActive { get; set; } = true;

  [BsonIgnoreIfNull]
  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } =
    DateTime.UtcNow;
}