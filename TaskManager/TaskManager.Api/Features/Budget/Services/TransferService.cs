using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class TransferService : BudgetBaseService
{
  /*===========================================================
    TransferService Constructor:
    => Receives the shared MongoDB database.
    => Passes the database to BudgetBaseService.
  ===========================================================*/
  public TransferService(
    IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    GetTransfersAsync:
    => Gets all transfers belonging to the logged-in user.
    => Sorts newest transfers first.
    => Includes source and destination account names.
  ===========================================================*/
  public async Task<List<AccountTransferResponse>>
    GetTransfersAsync(
      string userId)
  {
    var transfers = await AccountTransfers
      .Find(t => t.UserId == userId)
      .SortByDescending(t => t.TransferDate)
      .ThenByDescending(t => t.CreatedAtUtc)
      .ToListAsync();

    var accounts = await FinancialAccounts
      .Find(a => a.UserId == userId)
      .ToListAsync();

    var accountLookup =
      accounts.ToDictionary(
        a => a.Id,
        a => a);

    var responses =
      new List<AccountTransferResponse>();

    foreach (var transfer in transfers)
    {
      accountLookup.TryGetValue(
        transfer.FromAccountId,
        out var fromAccount);

      accountLookup.TryGetValue(
        transfer.ToAccountId,
        out var toAccount);

      responses.Add(
        TransferMapper.ToResponse(
          transfer,
          fromAccount,
          toAccount));
    }

    return responses;
  }

  /*===========================================================
    CreateTransferAsync:
    => Creates a transfer between two accounts.
    => Supports normal account transfers.
    => Supports credit-card payments without requiring a BillId.
    => Optionally links a payment to a Transfer bill.
    => Prevents credit-card payments from exceeding the card balance.
  ===========================================================*/
  public async Task<AccountTransferResponse?>
    CreateTransferAsync(
      CreateAccountTransferRequest request,
      string userId)
  {
    /*
      Load both accounts.

      This confirms:
      - both accounts exist;
      - both belong to the logged-in user.
    */
    var fromAccount =
      await GetAccountByIdAsync(
        request.FromAccountId,
        userId);

    var toAccount =
      await GetAccountByIdAsync(
        request.ToAccountId,
        userId);

    if (fromAccount == null ||
        toAccount == null)
    {
      return null;
    }

    /*
      An account cannot transfer money to itself.
    */
    if (fromAccount.Id ==
        toAccount.Id)
    {
      return null;
    }

    if (request.Amount <= 0)
    {
      return null;
    }

    /*
      BillId is optional.

      A transfer can exist without any bill.

      Example:
      Checking → Capital One
      $250

      If BillId is supplied, validate the relationship.
    */
    Bill? linkedBill = null;

    if (!string.IsNullOrWhiteSpace(
      request.BillId))
    {
      linkedBill = await Bills
        .Find(b =>
          b.Id == request.BillId &&
          b.UserId == userId)
        .FirstOrDefaultAsync();

      if (linkedBill == null)
      {
        return null;
      }

      /*
        Only Transfer bills can have linked AccountTransfers.
      */
      if (!string.Equals(
        linkedBill.PaymentType,
        BillPaymentTypes.Transfer,
        StringComparison.OrdinalIgnoreCase))
      {
        return null;
      }

      /*
        The transfer destination must match the bill's
        configured CreditCard destination account.
      */
      if (!string.Equals(
        linkedBill.DestinationAccountId,
        toAccount.Id,
        StringComparison.Ordinal))
      {
        return null;
      }
    }

    /*
      Detect whether this transfer is a credit-card payment.

      A credit-card payment is:

      Checking/Savings
      →
      CreditCard
    */
    var isCreditCardPayment =
      IsCashAccount(fromAccount) &&
      IsCreditCardAccount(toAccount);

    /*
      Prevent invalid transfers into a CreditCard.

      If the destination is CreditCard, the source must
      be Checking or Savings.
    */
    if (IsCreditCardAccount(toAccount) &&
        !IsCashAccount(fromAccount))
    {
      return null;
    }

    /*
      Credit-card payment rules.
    */
    if (isCreditCardPayment)
    {
      var creditCardBalance =
        await GetAccountCurrentBalanceAsync(
          toAccount);

      /*
        Do not allow payment when the card already has
        no outstanding balance.
      */
      if (creditCardBalance <= 0)
      {
        return null;
      }

      /*
        Prevent accidental overpayment.

        Example:
        Balance = $500
        Payment = $600
        → reject
      */
      if (request.Amount >
          creditCardBalance)
      {
        return null;
      }
    }

    /*
      If BillId was supplied, make sure the payment does not
      exceed the remaining amount on that bill.

      Example:
      Bill expected amount = $500
      Already paid = $250
      Remaining = $250

      Another $300 linked payment should be rejected.

      The user could still make an unlinked direct card payment
      if they intentionally want to pay more than the statement bill.
    */
    if (linkedBill != null)
    {
      var linkedPayments =
        await AccountTransfers
          .Find(t =>
            t.UserId == userId &&
            t.BillId == linkedBill.Id)
          .ToListAsync();

      var totalPaid =
        linkedPayments.Sum(
          t => t.Amount);

      var remainingBillAmount =
        Math.Max(
          0,
          linkedBill.ExpectedAmount -
          totalPaid);

      if (remainingBillAmount <= 0)
      {
        return null;
      }

      if (request.Amount >
          remainingBillAmount)
      {
        return null;
      }
    }

    var transfer =
      new AccountTransfer
      {
        UserId =
          userId,

        FromAccountId =
          fromAccount.Id,

        ToAccountId =
          toAccount.Id,

        BillId =
          linkedBill?.Id,

        Amount =
          request.Amount,

        TransferDate =
          request.TransferDate,

        Notes =
          request.Notes,

        CreatedAtUtc =
          DateTime.UtcNow
      };

    await AccountTransfers.InsertOneAsync(
      transfer);

    return TransferMapper.ToResponse(
      transfer,
      fromAccount,
      toAccount);
  }

  /*===========================================================
    DeleteTransferAsync:
    => Deletes one account transfer owned by the logged-in user.
    => Returns the deleted transfer information.
    => If linked to a bill, bill totals/status update automatically
       because they are calculated from remaining transfers.
  ===========================================================*/
  public async Task<AccountTransferResponse?>
    DeleteTransferAsync(
      string transferId,
      string userId)
  {
    var transfer = await AccountTransfers
      .Find(t =>
        t.Id == transferId &&
        t.UserId == userId)
      .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    var fromAccount =
      await GetAccountByIdAsync(
        transfer.FromAccountId,
        userId);

    var toAccount =
      await GetAccountByIdAsync(
        transfer.ToAccountId,
        userId);

    var deletedTransfer =
      TransferMapper.ToResponse(
        transfer,
        fromAccount,
        toAccount);

    var result =
      await AccountTransfers.DeleteOneAsync(
        t =>
          t.Id == transferId &&
          t.UserId == userId);

    if (result.DeletedCount == 0)
    {
      return null;
    }

    return deletedTransfer;
  }

  /*===========================================================
    PatchTransferAsync:
    => Partially updates an existing transfer.
    => Validates account ownership.
    => Supports linking and unlinking a Transfer bill.
    => Prevents using the same account as source and destination.
    => Prevents credit-card and bill overpayments.
  ===========================================================*/
  public async Task<AccountTransferResponse?>
    PatchTransferAsync(
      string transferId,
      PatchAccountTransferRequest request,
      string userId)
  {
    /*
      Find the existing transfer.
    */
    var transfer = await AccountTransfers
      .Find(t =>
        t.Id == transferId &&
        t.UserId == userId)
      .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    /*
      Use the requested account IDs when supplied.

      Otherwise, preserve the existing account IDs.
    */
    var newFromAccountId =
      request.FromAccountId ??
      transfer.FromAccountId;

    var newToAccountId =
      request.ToAccountId ??
      transfer.ToAccountId;

    /*
      An account cannot transfer money to itself.
    */
    if (newFromAccountId ==
        newToAccountId)
    {
      return null;
    }

    /*
      Load and validate both accounts.
    */
    var fromAccount =
      await GetAccountByIdAsync(
        newFromAccountId,
        userId);

    var toAccount =
      await GetAccountByIdAsync(
        newToAccountId,
        userId);

    if (fromAccount == null ||
        toAccount == null)
    {
      return null;
    }

    /*
      A transfer into a CreditCard must come from
      Checking or Savings.
    */
    if (IsCreditCardAccount(toAccount) &&
        !IsCashAccount(fromAccount))
    {
      return null;
    }

    /*
      Determine the updated amount.
    */
    var newAmount =
      request.Amount ??
      transfer.Amount;

    if (newAmount <= 0)
    {
      return null;
    }

    /*
      Determine the updated BillId.

      request.BillId == null:
      => Preserve the existing BillId.

      request.BillId == "":
      => Unlink the transfer from its bill.

      request.BillId contains an ID:
      => Link it to that bill.
    */
    var newBillId =
      request.BillId == null
        ? transfer.BillId
        : string.IsNullOrWhiteSpace(
            request.BillId)
          ? null
          : request.BillId;

    Bill? linkedBill = null;

    /*
      Validate the new bill relationship when a BillId exists.
    */
    if (!string.IsNullOrWhiteSpace(
      newBillId))
    {
      linkedBill = await Bills
        .Find(b =>
          b.Id == newBillId &&
          b.UserId == userId)
        .FirstOrDefaultAsync();

      if (linkedBill == null)
      {
        return null;
      }

      /*
        Only Transfer bills may contain linked transfers.
      */
      if (!string.Equals(
        linkedBill.PaymentType,
        BillPaymentTypes.Transfer,
        StringComparison.OrdinalIgnoreCase))
      {
        return null;
      }

      /*
        The transfer destination must match the
        destination account configured on the bill.
      */
      if (!string.Equals(
        linkedBill.DestinationAccountId,
        newToAccountId,
        StringComparison.Ordinal))
      {
        return null;
      }

      /*
        A Transfer bill should point to a CreditCard account.
      */
      if (!IsCreditCardAccount(
        toAccount))
      {
        return null;
      }
    }

    /*
      Validate a credit-card payment.

      Because the existing transfer may already affect the card
      balance, add its effect back before validating the updated
      replacement amount.
    */
    if (IsCreditCardAccount(toAccount) &&
        IsCashAccount(fromAccount))
    {
      var currentBalance =
        await GetAccountCurrentBalanceAsync(
          toAccount);

      /*
        Only add the old amount back when the existing transfer
        currently pays this same CreditCard account.

        This prevents incorrect calculations when changing
        the destination account.
      */
      var existingTransferPaidSameCard =
        transfer.ToAccountId ==
          toAccount.Id &&
        IsCashAccount(fromAccount);

      var balanceBeforeThisTransfer =
        existingTransferPaidSameCard
          ? currentBalance +
            transfer.Amount
          : currentBalance;

      if (balanceBeforeThisTransfer <= 0)
      {
        return null;
      }

      if (newAmount >
          balanceBeforeThisTransfer)
      {
        return null;
      }
    }

    /*
      When linked to a bill, prevent the updated transfer
      from making total payments exceed the bill amount.

      Exclude the current transfer from the existing payment total.
    */
    if (linkedBill != null)
    {
      var otherPayments =
        await AccountTransfers
          .Find(t =>
            t.UserId == userId &&
            t.BillId == linkedBill.Id &&
            t.Id != transfer.Id)
          .ToListAsync();

      var otherPaymentTotal =
        otherPayments.Sum(
          t => t.Amount);

      if (otherPaymentTotal +
          newAmount >
          linkedBill.ExpectedAmount)
      {
        return null;
      }
    }

    /*
      Build only the MongoDB updates that the user requested.
    */
    var updates =
      new List<
        UpdateDefinition<AccountTransfer>>();

    if (request.FromAccountId != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            t => t.FromAccountId,
            newFromAccountId));
    }

    if (request.ToAccountId != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            t => t.ToAccountId,
            newToAccountId));
    }

    /*
      BillId needs special handling.

      Empty string means remove BillId from the MongoDB document.
    */
    if (request.BillId != null)
    {
      if (newBillId == null)
      {
        updates.Add(
          Builders<AccountTransfer>.Update
            .Unset(
              t => t.BillId));
      }
      else
      {
        updates.Add(
          Builders<AccountTransfer>.Update
            .Set(
              t => t.BillId,
              newBillId));
      }
    }

    if (request.Amount.HasValue)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            t => t.Amount,
            newAmount));
    }

    if (request.TransferDate.HasValue)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            t => t.TransferDate,
            request.TransferDate.Value));
    }

    if (request.Notes != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            t => t.Notes,
            request.Notes));
    }

    /*
      Nothing was supplied to update.
    */
    if (updates.Count == 0)
    {
      return TransferMapper.ToResponse(
        transfer,
        fromAccount,
        toAccount);
    }

    var update =
      Builders<AccountTransfer>.Update
        .Combine(updates);

    var result =
      await AccountTransfers.UpdateOneAsync(
        t =>
          t.Id == transferId &&
          t.UserId == userId,
        update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    /*
      Reload the transfer after updating it.
    */
    var updatedTransfer =
      await AccountTransfers
        .Find(t =>
          t.Id == transferId &&
          t.UserId == userId)
        .FirstOrDefaultAsync();

    if (updatedTransfer == null)
    {
      return null;
    }

    var updatedFromAccount =
      await GetAccountByIdAsync(
        updatedTransfer.FromAccountId,
        userId);

    var updatedToAccount =
      await GetAccountByIdAsync(
        updatedTransfer.ToAccountId,
        userId);

    return TransferMapper.ToResponse(
      updatedTransfer,
      updatedFromAccount,
      updatedToAccount);
  }
  /*===========================================================
    IsCreditCardAccount:
    => Checks whether the account is a CreditCard account.
  ===========================================================*/
  private static bool IsCreditCardAccount(
    FinancialAccount account)
  {
    return string.Equals(
      account.Type,
      FinancialAccountTypes.CreditCard,
      StringComparison.OrdinalIgnoreCase);
  }

  /*===========================================================
    IsCashAccount:
    => Checks whether an account can be used to pay a credit card.
    => Checking and Savings are allowed.
  ===========================================================*/
  private static bool IsCashAccount(
    FinancialAccount account)
  {
    return
      string.Equals(
        account.Type,
        FinancialAccountTypes.Checking,
        StringComparison.OrdinalIgnoreCase) ||
      string.Equals(
        account.Type,
        FinancialAccountTypes.Savings,
        StringComparison.OrdinalIgnoreCase);
  }
}