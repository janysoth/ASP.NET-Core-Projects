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
    // Use an empty collection when no transfers were provided.
    var linkedTransfers =
      transfers ?? Array.Empty<AccountTransfer>();

    /*
      Expense Bill Actual Amount:
      => Comes from the single ExpenseRecord created when
         the expense bill is marked paid.
    */
    var expenseActualAmount =
      expense?.Amount;

    /*
      Transfer Bill Total Paid:
      => Adds all transfers linked to this bill.
      => Allows multiple credit-card payments toward one bill.
    */
    var transferTotalPaid =
      linkedTransfers.Sum(
        transfer => transfer.Amount);

    /*
      Total Paid:
      => Expense bills use the linked ExpenseRecord amount.
      => Transfer bills use the sum of all linked transfers.
    */
    var totalPaid =
      string.Equals(
        bill.PaymentType,
        BillPaymentTypes.Transfer,
        StringComparison.OrdinalIgnoreCase)
        ? transferTotalPaid
        : expenseActualAmount ?? 0;

    /*
      Remaining Amount:
      => Never returns a negative value.
      => If total payments meet or exceed the expected amount,
         remaining amount becomes zero.
    */
    var remainingAmount =
      Math.Max(
        0,
        bill.ExpectedAmount - totalPaid);

    /*
      Payment Count:
      => Expense bills have either zero or one payment record.
      => Transfer bills can have multiple payment records.
    */
    var paymentCount =
      string.Equals(
        bill.PaymentType,
        BillPaymentTypes.Transfer,
        StringComparison.OrdinalIgnoreCase)
        ? linkedTransfers.Count
        : expense != null
          ? 1
          : 0;

    /*
      Build the list of individual transfer payments.

      This list is mainly used by Transfer bills so the frontend
      can display each credit-card payment separately.
    */
    var paymentResponses =
      BuildPaymentResponses(
        linkedTransfers,
        accountLookup);

    /*
      Calculate whether the bill is considered paid.

      Expense bills:
      => Use the stored IsPaid value.

      Transfer bills:
      => Are considered paid when linked transfers equal or exceed
         the expected bill amount.
    */
    var isPaid =
      string.Equals(
        bill.PaymentType,
        BillPaymentTypes.Transfer,
        StringComparison.OrdinalIgnoreCase)
        ? totalPaid >= bill.ExpectedAmount &&
          bill.ExpectedAmount > 0
        : bill.IsPaid;

    /*
      ActualAmount:
      => Maintained for compatibility with the existing BillResponse.
      => Expense bills return the ExpenseRecord amount.
      => Transfer bills return the total of all linked payments.
    */
    decimal? actualAmount = null;

    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
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

      /*
        Expense Bill Information
      */
      BudgetCategoryId =
        bill.BudgetCategoryId,

      BudgetCategoryName =
        category?.Name,

      /*
        Transfer Bill Information
      */
      DestinationAccountId =
        bill.DestinationAccountId,

      DestinationAccountName =
        destinationAccount?.Name,

      /*
        Basic Bill Information
      */
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
        Expense bills still use ExpenseRecordId.

      */
      ExpenseRecordId =
        bill.ExpenseRecordId,


      /*
        For an Expense bill, this is the account that paid
        the expense.

        Transfer bill source accounts are available inside
        the Payments list because each payment may come from
        a different Checking or Savings account.
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
    => Converts linked AccountTransfers into BillPaymentResponse DTOs.
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
      .OrderBy(t => t.TransferDate)
      .ThenBy(t => t.CreatedAtUtc))
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
    => Transfer bills use the date of the latest linked payment
       once the bill has been fully paid.
    => Returns null when the bill is not fully paid.
  ===========================================================*/
  private static DateTime? GetPaidDate(
    Bill bill,
    IReadOnlyCollection<AccountTransfer> transfers)
  {
    /*
      Normal Expense Bill:
      => Continue using the stored PaidDate.
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
        transfer => transfer.Amount);

    /*
      A partially paid bill does not yet have a final paid date.
    */
    if (totalPaid <
        bill.ExpectedAmount)
    {
      return null;
    }

    /*
      Once fully paid, use the latest payment date.
    */
    return transfers
      .Max(
        transfer => transfer.TransferDate);
  }

  /*===========================================================
    GetStatus:
    => Calculates the current status of a bill.
    => Expense bills use their existing IsPaid flag.
    => Transfer bills calculate status from linked payments.
    => Supports Partially Paid status.
  ===========================================================*/
  private static string GetStatus(
    Bill bill,
    decimal totalPaid)
  {
    /*
      Transfer Bill:
      => Status depends on total linked payments.
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      if (totalPaid >= bill.ExpectedAmount &&
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
        => Uses the stored IsPaid flag.
      */
      if (bill.IsPaid)
      {
        return "Paid";
      }
    }

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