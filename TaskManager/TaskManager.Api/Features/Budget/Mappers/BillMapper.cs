using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class BillMapper
{
  /*===========================================================
    ToResponse:
    => Converts a Bill database model into a BillResponse DTO.
    => Supports both Expense bills and Transfer bills.
    => Expense bills use one linked ExpenseRecord.
    => Transfer bills can use multiple linked AccountTransfers.
    => Calculates total paid, remaining amount, payment count,
       and bill status.

    IMPORTANT:

    Expense Bill:
    => Once marked paid, RemainingAmount becomes 0.
    => ActualAmount may be different from ExpectedAmount.
    => The difference is budget variance, not unpaid balance.

    Transfer Bill:
    => RemainingAmount continues to represent the unpaid
       portion of the expected transfer bill.
  ===========================================================*/
  public static BillResponse ToResponse(
    Bill bill,
    BudgetCategory? category = null,
    ExpenseRecord? expense = null,
    IReadOnlyCollection<AccountTransfer>? transfers = null,
    FinancialAccount? expenseAccount = null,
    FinancialAccount? destinationAccount = null,
    IReadOnlyDictionary<string, FinancialAccount>? accountLookup = null)
  {
    /*
      Use an empty collection when no transfers were provided.
    */
    var linkedTransfers =
      transfers ?? Array.Empty<AccountTransfer>();

    /*
      Determine whether this is a Transfer bill.

      Transfer bills:
      => Support multiple payments.

      Expense bills:
      => Use one final ExpenseRecord.
    */
    var isTransferBill =
      string.Equals(
        bill.PaymentType,
        BillPaymentTypes.Transfer,
        StringComparison.OrdinalIgnoreCase);

    /*
      Expense Bill Actual Amount:
      => Comes from the linked ExpenseRecord.
    */
    var expenseActualAmount =
      expense?.Amount;

    /*
      Transfer Bill Total Paid:
      => Adds all transfers linked to this bill.
    */
    var transferTotalPaid =
      linkedTransfers.Sum(
        transfer =>
          transfer.Amount);

    /*
      Total Paid:

      Expense Bill:
      => Uses the ExpenseRecord amount.

      Transfer Bill:
      => Uses the total of all linked transfers.
    */
    var totalPaid =
      isTransferBill
        ? transferTotalPaid
        : expenseActualAmount ?? 0;

    /*=========================================================
      REMAINING AMOUNT
    =========================================================*/

    /*
      Expense Bill:

      Once Bill.IsPaid = true, the bill is considered fully
      settled.

      Example:

      Expected = $80
      Actual   = $74

      Bill Remaining = $0

      The $6 difference belongs to the category budget:

      Budget Remaining = $6

      ---------------------------------------------------------

      Transfer Bill:

      Expected = $500
      Paid     = $300

      Bill Remaining = $200
    */
    decimal remainingAmount;

    if (isTransferBill)
    {
      remainingAmount =
        Math.Max(
          0,
          bill.ExpectedAmount -
          transferTotalPaid);
    }
    else
    {
      remainingAmount =
        bill.IsPaid
          ? 0
          : bill.ExpectedAmount;
    }

    /*
      Payment Count:

      Expense bills:
      => Either zero or one ExpenseRecord.

      Transfer bills:
      => Can contain multiple AccountTransfers.
    */
    var paymentCount =
      isTransferBill
        ? linkedTransfers.Count
        : expense != null
          ? 1
          : 0;

    /*
      Build the list of individual transfer payments.

      Mainly used by Transfer bills.
    */
    var paymentResponses =
      BuildPaymentResponses(
        linkedTransfers,
        accountLookup);

    /*
      Calculate whether the bill is considered paid.

      Expense bills:
      => Use stored Bill.IsPaid.

      Transfer bills:
      => Fully paid when linked transfers meet or exceed
         ExpectedAmount.
    */
    var isPaid =
      isTransferBill
        ? totalPaid >=
            bill.ExpectedAmount &&
          bill.ExpectedAmount > 0
        : bill.IsPaid;

    /*
      ActualAmount:

      Expense Bill:
      => ExpenseRecord.Amount

      Transfer Bill:
      => Total linked transfer payments

      null:
      => Nothing has been paid yet.
    */
    decimal? actualAmount = null;

    if (isTransferBill)
    {
      if (linkedTransfers.Count > 0)
      {
        actualAmount =
          transferTotalPaid;
      }
    }
    else if (expense != null)
    {
      actualAmount =
        expense.Amount;
    }

    return new BillResponse
    {
      Id =
        bill.Id,

      BudgetMonthId =
        bill.BudgetMonthId,

      PaymentType =
        bill.PaymentType,

      /*=======================================================
        Expense Bill Information
      =======================================================*/

      BudgetCategoryId =
        bill.BudgetCategoryId,

      BudgetCategoryName =
        category?.Name,

      /*=======================================================
        Transfer Bill Information
      =======================================================*/

      DestinationAccountId =
        bill.DestinationAccountId,

      DestinationAccountName =
        destinationAccount?.Name,

      /*=======================================================
        Basic Bill Information
      =======================================================*/

      Name =
        bill.Name,

      ExpectedAmount =
        bill.ExpectedAmount,

      ActualAmount =
        actualAmount,

      TotalPaid =
        totalPaid,

      RemainingAmount =
        remainingAmount,

      PaymentCount =
        paymentCount,

      Payments =
        paymentResponses,

      DueDate =
        bill.DueDate,

      IsPaid =
        isPaid,

      Status =
        GetStatus(
          bill,
          totalPaid),

      /*
        Expense bills use ExpenseRecordId.
      */
      ExpenseRecordId =
        bill.ExpenseRecordId,

      /*
        Expense Bill:
        => Account used to pay the bill.

        Transfer Bill:
        => Source accounts are available inside Payments
           because each payment may come from a different
           Checking or Savings account.
      */
      AccountId =
        expenseAccount?.Id,

      AccountName =
        expenseAccount?.Name,

      PaidDate =
        GetPaidDate(
          bill,
          linkedTransfers),

      Notes =
        bill.Notes,

      CreatedAtUtc =
        bill.CreatedAtUtc
    };
  }

  /*===========================================================
    BuildPaymentResponses:
    => Converts linked AccountTransfers into
       BillPaymentResponse DTOs.
    => Adds source and destination account names.
    => Supports multiple payments toward one Transfer bill.
  ===========================================================*/
  private static List<BillPaymentResponse> BuildPaymentResponses(
    IReadOnlyCollection<AccountTransfer> transfers,
    IReadOnlyDictionary<string, FinancialAccount>? accountLookup)
  {
    var responses =
      new List<BillPaymentResponse>();

    foreach (var transfer in transfers
      .OrderBy(transfer =>
        transfer.TransferDate)
      .ThenBy(transfer =>
        transfer.CreatedAtUtc))
    {
      FinancialAccount? fromAccount = null;
      FinancialAccount? toAccount = null;

      if (accountLookup != null)
      {
        accountLookup.TryGetValue(
          transfer.FromAccountId,
          out fromAccount);

        accountLookup.TryGetValue(
          transfer.ToAccountId,
          out toAccount);
      }

      responses.Add(
        new BillPaymentResponse
        {
          Id =
            transfer.Id,

          FromAccountId =
            transfer.FromAccountId,

          FromAccountName =
            fromAccount?.Name ??
            string.Empty,

          ToAccountId =
            transfer.ToAccountId,

          ToAccountName =
            toAccount?.Name ??
            string.Empty,

          Amount =
            transfer.Amount,

          PaymentDate =
            transfer.TransferDate,

          Notes =
            transfer.Notes
        });
    }

    return responses;
  }

  /*===========================================================
    GetPaidDate:
    => Expense bills use the bill's stored PaidDate.
    => Transfer bills use the latest linked payment date
       once fully paid.
    => Partially paid Transfer bills return null.
  ===========================================================*/
  private static DateTime? GetPaidDate(
    Bill bill,
    IReadOnlyCollection<AccountTransfer> transfers)
  {
    /*
      Expense Bill:
      => Use the stored PaidDate.
    */
    if (!string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      return bill.PaidDate;
    }

    /*
      Transfer Bill:
      => No payments means no paid date.
    */
    if (transfers.Count == 0)
    {
      return null;
    }

    var totalPaid =
      transfers.Sum(
        transfer =>
          transfer.Amount);

    /*
      Partially paid Transfer bills do not yet have
      a final paid date.
    */
    if (totalPaid <
        bill.ExpectedAmount)
    {
      return null;
    }

    /*
      Once fully paid, use the latest payment date.
    */
    return transfers.Max(
      transfer =>
        transfer.TransferDate);
  }

  /*===========================================================
    GetStatus:
    => Calculates the bill status.

    Expense Bill:
    => Uses Bill.IsPaid.
    => Does not support Partially Paid.

    Transfer Bill:
    => Supports:
       - Partially Paid
       - Paid
       - standard due-date statuses
  ===========================================================*/
  private static string GetStatus(
    Bill bill,
    decimal totalPaid)
  {
    var isTransferBill =
      string.Equals(
        bill.PaymentType,
        BillPaymentTypes.Transfer,
        StringComparison.OrdinalIgnoreCase);

    /*
      Transfer Bill:
      => Status depends on linked payments.
    */
    if (isTransferBill)
    {
      if (totalPaid >=
          bill.ExpectedAmount &&
          bill.ExpectedAmount > 0)
      {
        return "Paid";
      }

      if (totalPaid > 0)
      {
        return "Partially Paid";
      }
    }
    else
    {
      /*
        Expense Bill:

        Once Bill.IsPaid is true, the bill is fully settled.

        ActualAmount does not have to equal ExpectedAmount.
      */
      if (bill.IsPaid)
      {
        return "Paid";
      }
    }

    /*
      Remaining statuses apply when the bill is not paid.
    */
    var today =
      DateTime.UtcNow.Date;

    var dueDate =
      bill.DueDate.Date;

    if (dueDate < today)
    {
      return "Overdue";
    }

    if (dueDate == today)
    {
      return "Due Today";
    }

    if (dueDate <=
        today.AddDays(7))
    {
      return "Due Soon";
    }

    return "Upcoming";
  }
}