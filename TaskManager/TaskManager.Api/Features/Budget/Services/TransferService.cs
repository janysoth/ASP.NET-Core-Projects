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
        .Find(transfer =>
          transfer.UserId == userId)
        .SortByDescending(transfer =>
          transfer.TransferDate)
        .ThenByDescending(transfer =>
          transfer.CreatedAtUtc)
        .ToListAsync();

    /*
      Load all accounts once.

      This avoids querying MongoDB separately for every transfer.
    */
    var accounts =
      await FinancialAccounts
        .Find(account =>
          account.UserId == userId)
        .ToListAsync();

    var accountLookup =
      accounts.ToDictionary(
        account => account.Id,
        account => account);

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
    => Creates a transfer between two financial accounts.

    Supported examples:

    Checking → Savings
    Savings  → Checking
    Checking → CreditCard
    Savings  → CreditCard

    Important:
    => Transfers do NOT create expenses.
    => Transfers do NOT belong to bills.
    => Credit-card payments reduce the card's current balance.
    => Future-dated transfers are not allowed.
  ===========================================================*/
  public async Task<AccountTransferResponse?>
    CreateTransferAsync(
      CreateAccountTransferRequest request,
      string userId)
  {
    /*---------------------------------------------------------
      Load the source account.
    ---------------------------------------------------------*/
    var fromAccount =
      await GetAccountByIdAsync(
        request.FromAccountId,
        userId);

    /*---------------------------------------------------------
      Load the destination account.
    ---------------------------------------------------------*/
    var toAccount =
      await GetAccountByIdAsync(
        request.ToAccountId,
        userId);

    /*
      Both accounts must exist and belong to the user.
    */
    if (fromAccount == null ||
        toAccount == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      An account cannot transfer money to itself.
    ---------------------------------------------------------*/
    if (fromAccount.Id ==
        toAccount.Id)
    {
      return null;
    }

    /*---------------------------------------------------------
      Transfer amount must be positive.
    ---------------------------------------------------------*/
    if (request.Amount <= 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Transfers represent money that already moved.

      Future-dated transfers are therefore not allowed.
    ---------------------------------------------------------*/
    if (request.TransferDate.Date >
        DateTime.UtcNow.Date)
    {
      return null;
    }

    /*---------------------------------------------------------
      Anything transferred INTO a CreditCard must come from
      a cash account.

      Allowed:

      Checking → CreditCard
      Savings  → CreditCard

      Not allowed:

      CreditCard → CreditCard
    ---------------------------------------------------------*/
    if (IsCreditCardAccount(
          toAccount) &&
        !IsCashAccount(
          fromAccount))
    {
      return null;
    }

    /*---------------------------------------------------------
      Credit-card payment validation.

      When the destination is a CreditCard and the source
      is Checking/Savings, this transfer is treated as a
      credit-card payment.
    ---------------------------------------------------------*/
    var isCreditCardPayment =
      IsCashAccount(
        fromAccount) &&
      IsCreditCardAccount(
        toAccount);

    if (isCreditCardPayment)
    {
      var creditCardBalance =
        await GetAccountCurrentBalanceAsync(
          toAccount);

      /*
        The card must currently have an outstanding balance.

        Example:

        CreditCard balance = $0
        Payment            = $100

        Reject because there is nothing to pay.
      */
      if (creditCardBalance <= 0)
      {
        return null;
      }

      /*
        Prevent accidental overpayment.

        Example:

        CreditCard balance = $175
        Payment            = $200

        Reject.
      */
      if (request.Amount >
          creditCardBalance)
      {
        return null;
      }
    }

    /*---------------------------------------------------------
      Create the AccountTransfer.

      Notice:
      => There is no BillId anymore.
    ---------------------------------------------------------*/
    var transfer =
      new AccountTransfer
      {
        UserId =
          userId,

        FromAccountId =
          fromAccount.Id,

        ToAccountId =
          toAccount.Id,

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

    Account balances automatically recalculate from the
    remaining transfers.
  ===========================================================*/
  public async Task<AccountTransferResponse?>
    DeleteTransferAsync(
      string transferId,
      string userId)
  {
    /*---------------------------------------------------------
      Find the transfer before deleting it.
    ---------------------------------------------------------*/
    var transfer =
      await AccountTransfers
        .Find(existingTransfer =>
          existingTransfer.Id ==
            transferId &&
          existingTransfer.UserId ==
            userId)
        .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load account information for the returned response.
    ---------------------------------------------------------*/
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

    /*---------------------------------------------------------
      Delete the transfer.
    ---------------------------------------------------------*/
    var result =
      await AccountTransfers.DeleteOneAsync(
        existingTransfer =>
          existingTransfer.Id ==
            transferId &&
          existingTransfer.UserId ==
            userId);

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
    => Prevents source and destination from being the same.
    => Prevents invalid credit-card payments.
    => Prevents credit-card overpayments.
    => Future-dated transfers are not allowed.

    IMPORTANT:
    => Transfers no longer link to bills.
  ===========================================================*/
  public async Task<AccountTransferResponse?>
    PatchTransferAsync(
      string transferId,
      PatchAccountTransferRequest request,
      string userId)
  {
    /*---------------------------------------------------------
      Find the existing transfer.
    ---------------------------------------------------------*/
    var transfer =
      await AccountTransfers
        .Find(existingTransfer =>
          existingTransfer.Id ==
            transferId &&
          existingTransfer.UserId ==
            userId)
        .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Determine the final source account ID.

      If not supplied, keep the existing one.
    ---------------------------------------------------------*/
    var newFromAccountId =
      request.FromAccountId ??
      transfer.FromAccountId;

    /*---------------------------------------------------------
      Determine the final destination account ID.
    ---------------------------------------------------------*/
    var newToAccountId =
      request.ToAccountId ??
      transfer.ToAccountId;

    /*---------------------------------------------------------
      Prevent self-transfers.
    ---------------------------------------------------------*/
    if (newFromAccountId ==
        newToAccountId)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the final source and destination accounts.
    ---------------------------------------------------------*/
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

    /*---------------------------------------------------------
      Anything going into a CreditCard must come from
      Checking or Savings.
    ---------------------------------------------------------*/
    if (IsCreditCardAccount(
          toAccount) &&
        !IsCashAccount(
          fromAccount))
    {
      return null;
    }

    /*---------------------------------------------------------
      Determine the final amount.
    ---------------------------------------------------------*/
    var newAmount =
      request.Amount ??
      transfer.Amount;

    if (newAmount <= 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Determine the final transfer date.
    ---------------------------------------------------------*/
    var newTransferDate =
      request.TransferDate ??
      transfer.TransferDate;

    /*
      Future-dated transfers are not allowed.
    */
    if (newTransferDate.Date >
        DateTime.UtcNow.Date)
    {
      return null;
    }

    /*---------------------------------------------------------
      Credit-card payment validation.

      The existing transfer may already be reducing this
      CreditCard balance.

      When editing that same transfer, temporarily add the old
      amount back before validating the replacement amount.

      Example:

      Card balance after current payment = $175
      Existing transfer                 = $125

      Balance before this transfer:

      $175 + $125 = $300
    ---------------------------------------------------------*/
    if (IsCreditCardAccount(
          toAccount) &&
        IsCashAccount(
          fromAccount))
    {
      var currentBalance =
        await GetAccountCurrentBalanceAsync(
          toAccount);

      /*
        Check whether the original transfer already paid
        this same CreditCard.
      */
      var existingTransferPaidSameCard =
        transfer.ToAccountId ==
          toAccount.Id &&
        IsTransferEffectiveTodayOrEarlier(
          transfer);

      /*
        Restore the original transfer amount only when that
        transfer is currently included in the account balance.
      */
      var balanceBeforeThisTransfer =
        existingTransferPaidSameCard
          ? currentBalance +
            transfer.Amount
          : currentBalance;

      /*
        There must be debt available to pay.
      */
      if (balanceBeforeThisTransfer <= 0)
      {
        return null;
      }

      /*
        Prevent the replacement payment from exceeding the
        available credit-card balance.
      */
      if (newAmount >
          balanceBeforeThisTransfer)
      {
        return null;
      }
    }

    /*---------------------------------------------------------
      Build only the fields supplied by the request.
    ---------------------------------------------------------*/
    var updates =
      new List<
        UpdateDefinition<AccountTransfer>>();

    if (request.FromAccountId != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            existingTransfer =>
              existingTransfer.FromAccountId,
            newFromAccountId));
    }

    if (request.ToAccountId != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            existingTransfer =>
              existingTransfer.ToAccountId,
            newToAccountId));
    }

    if (request.Amount.HasValue)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            existingTransfer =>
              existingTransfer.Amount,
            newAmount));
    }

    if (request.TransferDate.HasValue)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            existingTransfer =>
              existingTransfer.TransferDate,
            newTransferDate));
    }

    if (request.Notes != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update
          .Set(
            existingTransfer =>
              existingTransfer.Notes,
            request.Notes));
    }

    /*---------------------------------------------------------
      Nothing was supplied to change.

      Return the existing transfer response.
    ---------------------------------------------------------*/
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

    /*---------------------------------------------------------
      Apply the update.
    ---------------------------------------------------------*/
    var result =
      await AccountTransfers.UpdateOneAsync(
        existingTransfer =>
          existingTransfer.Id ==
            transferId &&
          existingTransfer.UserId ==
            userId,
        update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Reload the updated transfer.
    ---------------------------------------------------------*/
    var updatedTransfer =
      await AccountTransfers
        .Find(existingTransfer =>
          existingTransfer.Id ==
            transferId &&
          existingTransfer.UserId ==
            userId)
        .FirstOrDefaultAsync();

    if (updatedTransfer == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the final account names.
    ---------------------------------------------------------*/
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

    Allowed:
    => Checking
    => Savings
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

  /*===========================================================
    IsTransferEffectiveTodayOrEarlier:
    => Determines whether an existing transfer is currently
       included in account balance calculations.
  ===========================================================*/
  private static bool IsTransferEffectiveTodayOrEarlier(
    AccountTransfer transfer)
  {
    return
      transfer.TransferDate.Date <=
      DateTime.UtcNow.Date;
  }
}