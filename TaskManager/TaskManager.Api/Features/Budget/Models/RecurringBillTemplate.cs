using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

[BsonIgnoreExtraElements]
public class RecurringBillTemplate
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } =
    string.Empty;

  public string UserId { get; set; } =
    string.Empty;

  /*===========================================================
    CategoryName:
    => Identifies the Fixed Expense category that generated
       bills should use.

    IMPORTANT:
    => We store the category NAME instead of CategoryId because
       each budget month has its own category documents and IDs.

    Example:

    Template:
      CategoryName = "Utilities"

    August:
      Utilities CategoryId = abc123

    September:
      Utilities CategoryId = xyz789

    The template can still find the correct category by name.
  ===========================================================*/
  public string CategoryName { get; set; } =
    string.Empty;

  /*===========================================================
    Name:
    => Name of the bill that will be generated.

    Examples:

    Mortgage
    Internet
    Dance Fee
    Car Insurance
  ===========================================================*/
  public string Name { get; set; } =
    string.Empty;

  /*===========================================================
    ExpectedAmount:
    => Expected monthly amount of the recurring bill.

    Example:

    Internet = $80
    Mortgage = $1,600
  ===========================================================*/
  public decimal ExpectedAmount { get; set; }

  /*===========================================================
    DueDay:
    => Normal day of the month the bill is due.
    => Valid values are 1 through 31.

    If the selected month has fewer days, bill generation
    automatically uses the final valid day of that month.

    Example:

    DueDay = 31

    April:
    => April 30

    February:
    => February 28 or 29
  ===========================================================*/
  public int DueDay { get; set; }

  /*===========================================================
    IsActive:
    => Controls whether this template should generate bills.

    true:
    => Included when bills are generated.

    false:
    => Template is kept but no bill is generated.
  ===========================================================*/
  public bool IsActive { get; set; } =
    true;

  [BsonIgnoreIfNull]
  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } =
    DateTime.UtcNow;
}