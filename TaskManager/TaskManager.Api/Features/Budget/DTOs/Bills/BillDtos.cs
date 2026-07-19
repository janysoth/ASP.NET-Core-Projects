namespace TaskManager.Api.Features.Budget.DTOs.Bills;

public sealed record CreateBillRequest
{
  /*===========================================================
    PaymentType:
    => Expense for normal bills.
    => Transfer for credit-card payment bills.
  ===========================================================*/
  public string PaymentType { get; set; } =
    BillPaymentTypes.Expense;

  /*===========================================================
    BudgetCategoryId:
    => Required when PaymentType is Expense.
    => Must reference an Expense category in the budget month.
  ===========================================================*/
  public string? BudgetCategoryId { get; set; }

  /*===========================================================
    DestinationAccountId:
    => Required when PaymentType is Transfer.
    => Must reference a CreditCard account.
  ===========================================================*/
  public string? DestinationAccountId { get; set; }

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateBillRequest
{
  public string PaymentType { get; set; } =
    BillPaymentTypes.Expense;

  public string? BudgetCategoryId { get; set; }

  public string? DestinationAccountId { get; set; }

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record MarkBillPaidRequest
{
  /*===========================================================
    AccountId:
    => Expense bill: account used to pay the expense.
    => Transfer bill: source Checking/Savings account.
  ===========================================================*/
  public string AccountId { get; set; } = string.Empty;

  public decimal ActualAmount { get; set; }

  public DateTime PaidDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record BillResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string PaymentType { get; set; } = string.Empty;

  /*===========================================================
    Expense bill details:
  ===========================================================*/
  public string? BudgetCategoryId { get; set; }

  public string? BudgetCategoryName { get; set; }

  /*===========================================================
    Transfer bill details:
  ===========================================================*/
  public string? DestinationAccountId { get; set; }

  public string? DestinationAccountName { get; set; }

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public decimal? ActualAmount { get; set; }

  public DateTime DueDate { get; set; }

  public bool IsPaid { get; set; }

  public string Status { get; set; } = string.Empty;

  /*===========================================================
    Created payment record:
    => ExpenseRecordId is used for Expense bills.
    => AccountTransferId is used for Transfer bills.
  ===========================================================*/
  public string? ExpenseRecordId { get; set; }

  public string? AccountTransferId { get; set; }

  /*===========================================================
    Payment source:
    => Expense bill: account used for the expense.
    => Transfer bill: Checking/Savings source account.
  ===========================================================*/
  public string? AccountId { get; set; }

  public string? AccountName { get; set; }

  public DateTime? PaidDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record CreateRecurringBillTemplateRequest
{
  public string PaymentType { get; set; } =
    BillPaymentTypes.Expense;

  // Required for Expense templates.
  public string? CategoryName { get; set; }

  // Required for Transfer templates.
  public string? DestinationAccountId { get; set; }

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public int DueDay { get; set; }

  public bool IsActive { get; set; } = true;

  public string? Notes { get; set; }
}

public sealed record UpdateRecurringBillTemplateRequest
{
  public string PaymentType { get; set; } =
    BillPaymentTypes.Expense;

  public string? CategoryName { get; set; }

  public string? DestinationAccountId { get; set; }

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public int DueDay { get; set; }

  public bool IsActive { get; set; }

  public string? Notes { get; set; }
}

public sealed record RecurringBillTemplateResponse
{
  public string Id { get; set; } = string.Empty;

  public string PaymentType { get; set; } = string.Empty;

  public string? CategoryName { get; set; }

  public string? DestinationAccountId { get; set; }

  public string? DestinationAccountName { get; set; }

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public int DueDay { get; set; }

  public bool IsActive { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record GenerateBillsRequest
{
  public int Month { get; set; }

  public int Year { get; set; }
}

public sealed record GenerateBillsResponse
{
  public int TargetMonth { get; set; }

  public int TargetYear { get; set; }

  public int TotalTemplates { get; set; }

  public int CreatedBills { get; set; }

  public int SkippedExistingBills { get; set; }

  public int SkippedMissingCategories { get; set; }

  public List<BillResponse> Bills { get; set; } = [];

  public List<string> Messages { get; set; } = [];
}