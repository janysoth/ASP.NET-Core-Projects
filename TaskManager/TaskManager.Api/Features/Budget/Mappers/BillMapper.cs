using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class BillMapper
{
  /*===========================================================
    ToResponse:
    => Converts a Bill into a BillResponse.
    => Supports both Expense bills and Transfer bills.
    => Includes linked category and account information.
  ===========================================================*/
  public static BillResponse ToResponse(
    Bill bill,
    BudgetCategory? category = null,
    ExpenseRecord? expense = null,
    AccountTransfer? transfer = null,
    FinancialAccount? sourceAccount = null,
    FinancialAccount? destinationAccount = null)
  {
    decimal? actualAmount = null;

    if (expense != null)
    {
      actualAmount = expense.Amount;
    }
    else if (transfer != null)
    {
      actualAmount = transfer.Amount;
    }

    return new BillResponse
    {
      Id = bill.Id,
      BudgetMonthId = bill.BudgetMonthId,
      PaymentType = bill.PaymentType,

      BudgetCategoryId = bill.BudgetCategoryId,
      BudgetCategoryName = category?.Name,

      DestinationAccountId =
        bill.DestinationAccountId,

      DestinationAccountName =
        destinationAccount?.Name,

      Name = bill.Name,
      ExpectedAmount = bill.ExpectedAmount,
      ActualAmount = actualAmount,
      DueDate = bill.DueDate,
      IsPaid = bill.IsPaid,
      Status = GetStatus(bill),

      ExpenseRecordId = bill.ExpenseRecordId,

      AccountTransferId =
        bill.AccountTransferId,

      AccountId = sourceAccount?.Id,

      AccountName = sourceAccount?.Name,

      PaidDate = bill.PaidDate,
      Notes = bill.Notes,
      CreatedAtUtc = bill.CreatedAtUtc
    };
  }

  /*===========================================================
    GetStatus:
    => Calculates the current bill status.
    => Paid bills always return Paid.
  ===========================================================*/
  public static string GetStatus(Bill bill)
  {
    if (bill.IsPaid)
    {
      return "Paid";
    }

    var today = DateTime.UtcNow.Date;
    var dueDate = bill.DueDate.Date;

    if (dueDate < today)
    {
      return "Overdue";
    }

    if (dueDate == today)
    {
      return "Due Today";
    }

    if (dueDate <= today.AddDays(7))
    {
      return "Due Soon";
    }

    return "Upcoming";
  }
}