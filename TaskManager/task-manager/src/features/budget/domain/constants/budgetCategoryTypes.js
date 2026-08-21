/*===========================================================
  BUDGET_CATEGORY_TYPES:
  => Top-level BudgetCategory.Type values.

  IMPORTANT:
  => Fixed and Variable are NOT category types.
  => They belong to ExpenseType.

  Backend model:

  Type:
  => Expense
  => Savings
===========================================================*/
export const BUDGET_CATEGORY_TYPES = {
  EXPENSE: 'Expense',
  SAVINGS: 'Savings',
};