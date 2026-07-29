using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class BillMapper
{
  /*===========================================================
    ToResponse:
    => Converts a Bill database model into a BillResponse DTO.
    => Every bill represents a Fixed Expense obligation.
    => A paid bill has one linked ExpenseRecord.
    => Calculates actual amount, remaining amount, and status.

    IMPORTANT:

    ExpectedAmount:
    => Planned cost of the bill.

    ActualAmount:
    => Actual amount paid through the linked ExpenseRecord.

    RemainingAmount:
    => Unpaid bill = ExpectedAmount.
    => Paid bill = 0.

    Example:

    Expected Internet Bill = $80
    Actual Payment         = $74

    Bill Remaining         = $0
    Budget Remaining       = $6

    The $6 difference belongs to the budget category,
    not to the bill balance.
  ===========================================================*/
  public static BillResponse ToResponse(
    Bill bill,
    BudgetCategory? category = null,
    ExpenseRecord? expense = null,
    FinancialAccount? paymentAccount = null)
  {
    /*
      Actual amount comes from the ExpenseRecord created
      when the bill is marked paid.

      null means the bill has not been paid yet.
    */
    var actualAmount =
      expense?.Amount;

    /*
      Once an Expense bill is marked paid, it is considered
      fully settled regardless of whether ActualAmount differs
      from ExpectedAmount.

      Example:

      Expected = $80
      Actual   = $74

      RemainingAmount = $0

      The $6 difference is budget variance.
    */
    var remainingAmount =
      bill.IsPaid
        ? 0
        : bill.ExpectedAmount;

    return new BillResponse
    {
      Id =
        bill.Id,

      BudgetMonthId =
        bill.BudgetMonthId,

      /*=======================================================
        Budget Category
      =======================================================*/

      BudgetCategoryId =
        bill.BudgetCategoryId,

      BudgetCategoryName =
        category?.Name ??
        string.Empty,

      /*=======================================================
        Basic Bill Information
      =======================================================*/

      Name =
        bill.Name,

      ExpectedAmount =
        bill.ExpectedAmount,

      ActualAmount =
        actualAmount,

      DueDate =
        bill.DueDate,

      IsPaid =
        bill.IsPaid,

      Status =
        GetStatus(
          bill),

      /*=======================================================
        Payment Information
      =======================================================*/

      ExpenseRecordId =
        bill.ExpenseRecordId,

      AccountId =
        paymentAccount?.Id,

      AccountName =
        paymentAccount?.Name,

      PaidDate =
        bill.PaidDate,

      RemainingAmount =
        remainingAmount,

      Notes =
        bill.Notes,

      CreatedAtUtc =
        bill.CreatedAtUtc
    };
  }

  /*===========================================================
    GetStatus:
    => Calculates the current bill status.
    => Paid bills always return Paid.
    => Unpaid bills use their due date.
  ===========================================================*/
  private static string GetStatus(
    Bill bill)
  {
    /*
      Once the bill has been paid, due-date status no longer
      matters.
    */
    if (bill.IsPaid)
    {
      return "Paid";
    }

    var today =
      DateTime.UtcNow.Date;

    var dueDate =
      bill.DueDate.Date;

    /*
      Due date has already passed.
    */
    if (dueDate < today)
    {
      return "Overdue";
    }

    /*
      Due today.
    */
    if (dueDate == today)
    {
      return "Due Today";
    }

    /*
      Due within the next seven days.
    */
    if (dueDate <=
        today.AddDays(7))
    {
      return "Due Soon";
    }

    /*
      More than seven days away.
    */
    return "Upcoming";
  }
}