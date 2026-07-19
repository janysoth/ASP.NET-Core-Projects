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

  /*===========================================================
    PaymentType:
    => Determines what happens when the bill is paid.
    => Expense creates an ExpenseRecord.
    => Transfer creates an AccountTransfer.
  ===========================================================*/
  public string PaymentType { get; set; } =
    BillPaymentTypes.Expense;

  /*===========================================================
    BudgetCategoryId:
    => Used only for Expense bills.
    => Links the bill to an Expense budget category.
    => Transfer bills leave this null.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? BudgetCategoryId { get; set; }

  /*===========================================================
    DestinationAccountId:
    => Used only for Transfer bills.
    => Identifies the CreditCard account being paid.
    => Expense bills leave this null.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? DestinationAccountId { get; set; }

  /*===========================================================
    RecurringBillTemplateId:
    => Stores the recurring template that generated this bill.
    => Manual bills leave this null.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? RecurringBillTemplateId { get; set; }

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public bool IsPaid { get; set; }

  /*===========================================================
    ExpenseRecordId:
    => Set only when an Expense bill is paid.
    => Links to the automatically created ExpenseRecord.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? ExpenseRecordId { get; set; }

  /*===========================================================
    AccountTransferId:
    => Legacy field from the original single-payment design.
    => New Transfer bills use AccountTransfer.BillId instead.
    => Can be removed after old data has been migrated.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? AccountTransferId { get; set; }

  [BsonIgnoreIfNull]
  public DateTime? PaidDate { get; set; }

  [BsonIgnoreIfNull]
  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } =
    DateTime.UtcNow;
}