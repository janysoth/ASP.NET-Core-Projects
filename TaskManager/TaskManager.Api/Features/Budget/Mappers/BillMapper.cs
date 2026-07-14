using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class BillMapper
{
  /*===========================================================
    ToResponse:
    => Converts a Bill model into a BillResponse DTO.
    => Adds category, account, and actual expense information.
    => Calculates the bill status from its paid state and due date.
  ===========================================================*/
  public static BillResponse ToResponse(
    Bill bill,
    BudgetCategory? category,
    ExpenseRecord? expense,
    FinancialAccount? account)
  {
    return new BillResponse
    {
      Id = bill.Id,
      BudgetMonthId = bill.BudgetMonthId,
      BudgetCategoryId = bill.BudgetCategoryId,
      BudgetCategoryName = category?.Name ?? string.Empty,
      Name = bill.Name,
      ExpectedAmount = bill.ExpectedAmount,
      ActualAmount = expense?.Amount,
      DueDate = bill.DueDate,
      IsPaid = bill.IsPaid,
      Status = GetStatus(bill),
      ExpenseRecordId = bill.ExpenseRecordId,
      AccountId = expense?.AccountId,
      AccountName = account?.Name,
      PaidDate = bill.PaidDate,
      Notes = bill.Notes,
      CreatedAtUtc = bill.CreatedAtUtc
    };
  }

  /*===========================================================
    GetStatus:
    => Calculates the current display status for a bill.
    => Uses the paid flag and due date.
    => Does not store duplicate status text in MongoDB.
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