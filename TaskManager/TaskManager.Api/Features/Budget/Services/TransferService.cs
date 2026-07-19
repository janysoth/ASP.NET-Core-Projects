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
    => Prevents using the same account as source and destination.
    => Keeps existing BillId unchanged in this version.
  ===========================================================*/
  public async Task<AccountTransferResponse?>
    PatchTransferAsync(
      string transferId,
      PatchAccountTransferRequest request,
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

    var newFromAccountId =
      request.FromAccountId ??
      transfer.FromAccountId;

    var newToAccountId =
      request.ToAccountId ??
      transfer.ToAccountId;

    if (newFromAccountId ==
        newToAccountId)
    {
      return null;
    }

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
      Preserve the same credit-card payment rules
      when changing transfer accounts.
    */
    if (IsCreditCardAccount(toAccount) &&
        !IsCashAccount(fromAccount))
    {
      return null;
    }

    /*
      If this transfer is linked to a bill, the destination
      account must continue matching the bill.
    */
    if (!string.IsNullOrWhiteSpace(
      transfer.BillId))
    {
      var linkedBill = await Bills
        .Find(b =>
          b.Id == transfer.BillId &&
          b.UserId == userId)
        .FirstOrDefaultAsync();

      if (linkedBill == null)
      {
        return null;
      }

      if (!string.Equals(
        linkedBill.DestinationAccountId,
        newToAccountId,
        StringComparison.Ordinal))
      {
        return null;
      }
    }

    var newAmount =
      request.Amount ??
      transfer.Amount;

    if (newAmount <= 0)
    {
      return null;
    }

    /*
      Validate credit-card balance when changing amount.

      Because this transfer already affects the current balance,
      temporarily add its old amount back before determining the
      maximum allowed replacement amount.
    */
    if (IsCreditCardAccount(toAccount) &&
        IsCashAccount(fromAccount))
    {
      var currentBalance =
        await GetAccountCurrentBalanceAsync(
          toAccount);

      var balanceBeforeThisTransfer =
        currentBalance +
        transfer.Amount;

      if (newAmount >
          balanceBeforeThisTransfer)
      {
        return null;
      }
    }

    /*
      If linked to a bill, prevent the edited payment from
      exceeding the bill's expected amount.

      Exclude the current transfer from the total first.
    */
    if (!string.IsNullOrWhiteSpace(
      transfer.BillId))
    {
      var otherPayments =
        await AccountTransfers
          .Find(t =>
            t.UserId == userId &&
            t.BillId == transfer.BillId &&
            t.Id != transfer.Id)
          .ToListAsync();

      var otherPaymentTotal =
        otherPayments.Sum(
          t => t.Amount);

      var linkedBill =
        await Bills
          .Find(b =>
            b.Id == transfer.BillId &&
            b.UserId == userId)
          .FirstOrDefaultAsync();

      if (linkedBill == null)
      {
        return null;
      }

      if (otherPaymentTotal +
          newAmount >
          linkedBill.ExpectedAmount)
      {
        return null;
      }
    }

    var updates =
      new List<
        UpdateDefinition<AccountTransfer>>();

    if (request.FromAccountId != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            t => t.FromAccountId,
            request.FromAccountId));
    }

    if (request.ToAccountId != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            t => t.ToAccountId,
            request.ToAccountId));
    }

    if (request.Amount.HasValue)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            t => t.Amount,
            request.Amount.Value));
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

    await AccountTransfers.UpdateOneAsync(
      t =>
        t.Id == transferId &&
        t.UserId == userId,
      update);

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