using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskManager.Api.Features.Budget.Models;

public class AccountTransfer
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = string.Empty;

  public string UserId { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string FromAccountId { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string ToAccountId { get; set; } = string.Empty;

  /*===========================================================
    BillId:
    => Optionally links this transfer to a Transfer bill.
    => Multiple transfers may reference the same bill.
    => Normal standalone transfers leave this null.
  ===========================================================*/
  [BsonRepresentation(BsonType.ObjectId)]
  [BsonIgnoreIfNull]
  public string? BillId { get; set; }

  public decimal Amount { get; set; }

  public DateTime TransferDate { get; set; }

  [BsonIgnoreIfNull]
  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; } =
    DateTime.UtcNow;
}