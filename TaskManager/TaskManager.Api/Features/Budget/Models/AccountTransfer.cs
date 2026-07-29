using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

[BsonIgnoreExtraElements]
public class AccountTransfer
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } =
    string.Empty;

  public string UserId { get; set; } =
    string.Empty;

  /*===========================================================
    FromAccountId:
    => Account the money is leaving.

    Examples:

    Checking
    Savings
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  public string FromAccountId { get; set; } =
    string.Empty;

  /*===========================================================
    ToAccountId:
    => Account receiving the money.

    Examples:

    Savings
    Checking
    CreditCard
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  public string ToAccountId { get; set; } =
    string.Empty;

  /*===========================================================
    Amount:
    => Amount of money moved between the two accounts.
    => Must always be greater than zero.
  ===========================================================*/
  public decimal Amount { get; set; }

  /*===========================================================
    TransferDate:
    => Date the money actually moved.
    => Future-dated transfers are not allowed.
  ===========================================================*/
  public DateTime TransferDate { get; set; }

  [BsonIgnoreIfNull]
  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } =
    DateTime.UtcNow;
}