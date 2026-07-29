namespace TaskManager.Api.Features.Budget.DTOs.Bills;

/*=============================================================
  CreateBillRequest:
  => Creates a Fixed Expense bill for one budget month.
  => Every bill must belong to a Fixed Expense category.
=============================================================*/
public sealed record CreateBillRequest
{
  /*===========================================================
    BudgetCategoryId:
    => Required for every bill.
    => Must reference a Fixed Expense category belonging
       to the selected budget month.
  ===========================================================*/
  public string BudgetCategoryId { get; set; } =
    string.Empty;

  public string Name { get; set; } =
    string.Empty;

  /*
    Amount we expect this bill to cost.

    Example:

    Mortgage = $1,600
    Internet = $80
  */
  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public string? Notes { get; set; }
}

/*=============================================================
  UpdateBillRequest:
  => Updates an existing Fixed Expense bill.
=============================================================*/
public sealed record UpdateBillRequest
{
  public string BudgetCategoryId { get; set; } =
    string.Empty;

  public string Name { get; set; } =
    string.Empty;

  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public string? Notes { get; set; }
}

/*=============================================================
  MarkBillPaidRequest:
  => Pays a Fixed Expense bill.
  => Creates one ExpenseRecord.
=============================================================*/
public sealed record MarkBillPaidRequest
{
  /*===========================================================
    AccountId:
    => Account used to pay the bill.

    Examples:

    Checking
    Savings
    CreditCard
  ===========================================================*/
  public string AccountId { get; set; } =
    string.Empty;

  /*
    Actual amount paid.

    This may be different from ExpectedAmount.

    Example:

    Expected Internet = $80
    Actual Payment    = $74

    The bill becomes Paid.

    The $6 difference remains available in the budget.
  */
  public decimal ActualAmount { get; set; }

  public DateTime PaidDate { get; set; }

  public string? Notes { get; set; }
}

/*=============================================================
  BillResponse:
  => Complete API representation of one Fixed Expense bill.
=============================================================*/
public sealed record BillResponse
{
  public string Id { get; set; } =
    string.Empty;

  public string BudgetMonthId { get; set; } =
    string.Empty;

  /*===========================================================
    Budget Category:
    => Every bill belongs to a Fixed Expense category.
  ===========================================================*/
  public string BudgetCategoryId { get; set; } =
    string.Empty;

  public string BudgetCategoryName { get; set; } =
    string.Empty;

  public string Name { get; set; } =
    string.Empty;

  /*
    Planned amount for this bill.
  */
  public decimal ExpectedAmount { get; set; }

  /*
    Actual amount paid.

    null means the bill has not been paid yet.
  */
  public decimal? ActualAmount { get; set; }

  public DateTime DueDate { get; set; }

  public bool IsPaid { get; set; }

  /*
    Example statuses:

    Paid
    Overdue
    Due Today
    Due Soon
    Upcoming
  */
  public string Status { get; set; } =
    string.Empty;

  /*===========================================================
    ExpenseRecordId:
    => Links to the ExpenseRecord created when the bill
       is marked paid.
    => null while unpaid.
  ===========================================================*/
  public string? ExpenseRecordId { get; set; }

  /*===========================================================
    Payment Account:
    => Account used to pay the bill.
    => null while unpaid.
  ===========================================================*/
  public string? AccountId { get; set; }

  public string? AccountName { get; set; }

  public DateTime? PaidDate { get; set; }

  /*===========================================================
    RemainingAmount:

    Unpaid bill:
    => ExpectedAmount

    Paid bill:
    => 0

    IMPORTANT:
    => Budget variance is calculated by the budget category,
       not by this field.

    Example:

    Expected = $80
    Actual   = $74

    Bill Remaining   = $0
    Budget Remaining = $6
  ===========================================================*/
  public decimal RemainingAmount { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

/*=============================================================
  CreateRecurringBillTemplateRequest:
  => Creates a recurring Fixed Expense bill template.
  => CategoryName is used because category IDs differ from
     one budget month to another.
=============================================================*/
public sealed record CreateRecurringBillTemplateRequest
{
  /*===========================================================
    CategoryName:
    => Fixed Expense category that generated bills should use.

    Example:

    Housing
    Utilities
    Kids Activities
  ===========================================================*/
  public string CategoryName { get; set; } =
    string.Empty;

  public string Name { get; set; } =
    string.Empty;

  public decimal ExpectedAmount { get; set; }

  /*
    Day of the month the bill is normally due.

    Example:
    Mortgage = 1
    Internet = 15
  */
  public int DueDay { get; set; }

  public bool IsActive { get; set; } =
    true;

  public string? Notes { get; set; }
}

/*=============================================================
  UpdateRecurringBillTemplateRequest:
  => Updates a recurring Fixed Expense bill template.
=============================================================*/
public sealed record UpdateRecurringBillTemplateRequest
{
  public string CategoryName { get; set; } =
    string.Empty;

  public string Name { get; set; } =
    string.Empty;

  public decimal ExpectedAmount { get; set; }

  public int DueDay { get; set; }

  public bool IsActive { get; set; }

  public string? Notes { get; set; }
}

/*=============================================================
  RecurringBillTemplateResponse:
  => Returns one recurring Fixed Expense bill template.
=============================================================*/
public sealed record RecurringBillTemplateResponse
{
  public string Id { get; set; } =
    string.Empty;

  public string CategoryName { get; set; } =
    string.Empty;

  public string Name { get; set; } =
    string.Empty;

  public decimal ExpectedAmount { get; set; }

  public int DueDay { get; set; }

  public bool IsActive { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

/*=============================================================
  GenerateBillsRequest:
  => Selects the month/year for recurring bill generation.
=============================================================*/
public sealed record GenerateBillsRequest
{
  public int Month { get; set; }

  public int Year { get; set; }
}

/*=============================================================
  GenerateBillsResponse:
  => Summarizes recurring bill generation.
=============================================================*/
public sealed record GenerateBillsResponse
{
  public int TargetMonth { get; set; }

  public int TargetYear { get; set; }

  public int TotalTemplates { get; set; }

  public int CreatedBills { get; set; }

  public int SkippedExistingBills { get; set; }

  public int SkippedMissingCategories { get; set; }

  public List<BillResponse> Bills { get; set; } =
    [];

  public List<string> Messages { get; set; } =
    [];
}