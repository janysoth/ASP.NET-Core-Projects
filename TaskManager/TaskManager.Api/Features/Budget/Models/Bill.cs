using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

[BsonIgnoreExtraElements]
public class Bill
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  public string UserId { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  /*===========================================================
    BudgetCategoryId:
    => Links the bill to a Fixed Expense budget category.
    => Every bill must belong to an Expense category.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  public string BudgetCategoryId { get; set; } =
    string.Empty;

  /*===========================================================
    RecurringBillTemplateId:
    => Stores the recurring template that generated this bill.
    => Manual bills leave this null.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? RecurringBillTemplateId { get; set; }

  public string Name { get; set; } =
    string.Empty;

  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public bool IsPaid { get; set; }

  /*===========================================================
    ExpenseRecordId:
    => Set when the bill is paid.
    => Links to the automatically created ExpenseRecord.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? ExpenseRecordId { get; set; }

  [BsonIgnoreIfNull]
  public DateTime? PaidDate { get; set; }

  [BsonIgnoreIfNull]
  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } =
    DateTime.UtcNow;
}