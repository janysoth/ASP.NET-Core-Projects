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
    var transfers =
      await AccountTransfers
        .Find(t =>
          t.UserId == userId)
        .SortByDescending(t =>
          t.TransferDate)
        .ThenByDescending(t =>
          t.CreatedAtUtc)
        .ToListAsync();

    var accounts =
      await FinancialAccounts
        .Find(a =>
          a.UserId == userId)
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
    => Prevents credit-card payments from exceeding card balance.
    => Future-dated transfers are not allowed.
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

    /*
      Transfer amount must be positive.
    */
    if (request.Amount <= 0)
    {
      return null;
    }

    /*
      Transfers represent money that has already moved.

      Future-dated transfers are not allowed.
    */
    if (request.TransferDate.Date >
        DateTime.UtcNow.Date)
    {
      return null;
    }

    /*
      BillId is optional.

      Example without BillId:

      Checking
      →
      CreditCard

      If BillId is supplied, validate the relationship.
    */
    Bill? linkedBill = null;

    if (!string.IsNullOrWhiteSpace(
      request.BillId))
    {
      linkedBill =
        await Bills
          .Find(b =>
            b.Id == request.BillId &&
            b.UserId == userId)
          .FirstOrDefaultAsync();

      if (linkedBill == null)
      {
        return null;
      }

      /*
        Only Transfer bills can have linked transfers.
      */
      if (!string.Equals(
        linkedBill.PaymentType,
        BillPaymentTypes.Transfer,
        StringComparison.OrdinalIgnoreCase))
      {
        return null;
      }

      /*
        Destination account must match the bill's
        configured CreditCard account.
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
      Detect whether this is a credit-card payment.

      Checking/Savings
      →
      CreditCard
    */
    var isCreditCardPayment =
      IsCashAccount(fromAccount) &&
      IsCreditCardAccount(toAccount);

    /*
      Anything going into a CreditCard must come from
      Checking or Savings.
    */
    if (IsCreditCardAccount(toAccount) &&
        !IsCashAccount(fromAccount))
    {
      return null;
    }

    /*
      Credit-card payment validation.
    */
    if (isCreditCardPayment)
    {
      var creditCardBalance =
        await GetAccountCurrentBalanceAsync(
          toAccount);

      /*
        Card must have an outstanding balance.
      */
      if (creditCardBalance <= 0)
      {
        return null;
      }

      /*
        Do not allow accidental card overpayment.
      */
      if (request.Amount >
          creditCardBalance)
      {
        return null;
      }
    }

    /*
      If linked to a bill, prevent payments from
      exceeding the remaining bill amount.
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
    => If linked to a bill, bill totals/status automatically
       recalculate from the remaining transfers.
  ===========================================================*/
  public async Task<AccountTransferResponse?>
    DeleteTransferAsync(
      string transferId,
      string userId)
  {
    var transfer =
      await AccountTransfers
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
    => Prevents using the same account as source/destination.
    => Prevents credit-card and bill overpayments.
    => Future-dated transfers are not allowed.
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
    var transfer =
      await AccountTransfers
        .Find(t =>
          t.Id == transferId &&
          t.UserId == userId)
        .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    /*
      Use requested account IDs when supplied.

      Otherwise preserve the existing IDs.
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
      Transfers into a CreditCard must come from
      Checking or Savings.
    */
    if (IsCreditCardAccount(toAccount) &&
        !IsCashAccount(fromAccount))
    {
      return null;
    }

    /*
      Determine the final amount.
    */
    var newAmount =
      request.Amount ??
      transfer.Amount;

    if (newAmount <= 0)
    {
      return null;
    }

    /*
      Determine the final transfer date.

      If the request does not contain a new date,
      preserve the existing transfer date.
    */
    var newTransferDate =
      request.TransferDate ??
      transfer.TransferDate;

    /*
      Transfers represent money that has already moved.

      Future-dated transfers are not allowed.
    */
    if (newTransferDate.Date >
        DateTime.UtcNow.Date)
    {
      return null;
    }

    /*
      Determine the final BillId.

      null:
      => preserve current BillId

      empty string:
      => unlink from bill

      ID:
      => link to that bill
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
      Validate bill relationship when a BillId exists.
    */
    if (!string.IsNullOrWhiteSpace(
      newBillId))
    {
      linkedBill =
        await Bills
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
        Destination must match the bill's configured account.
      */
      if (!string.Equals(
        linkedBill.DestinationAccountId,
        newToAccountId,
        StringComparison.Ordinal))
      {
        return null;
      }

      /*
        Transfer bill destination must be a CreditCard.
      */
      if (!IsCreditCardAccount(
        toAccount))
      {
        return null;
      }
    }

    /*
      Validate a credit-card payment.

      The existing transfer may already affect the card balance,
      so its previous amount must be restored before validating
      the replacement amount.
    */
    if (IsCreditCardAccount(toAccount) &&
        IsCashAccount(fromAccount))
    {
      var currentBalance =
        await GetAccountCurrentBalanceAsync(
          toAccount);

      /*
        Only restore the existing amount when the old transfer
        already paid this same CreditCard.
      */
      var existingTransferPaidSameCard =
        transfer.ToAccountId ==
          toAccount.Id;

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
      Prevent the updated transfer from making
      bill payments exceed the bill amount.

      Exclude the current transfer from the total because
      it is being replaced by newAmount.
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
      Build only the updates supplied by the user.
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
      Empty BillId means unlink the transfer.
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
            newTransferDate));
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
      Reload the transfer after updating.
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
    => Checks whether an account is a CreditCard account.
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
    => Checks whether an account can be used as the source
       of a credit-card payment.
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