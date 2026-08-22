import {
  BUDGET_CATEGORY_TYPES,
  EXPENSE_TYPES,
} from '../constants';

/*===========================================================
  isExpenseCategory
===========================================================*/
export const isExpenseCategory = (
  category
) => {
  return (
    category?.type ===
    BUDGET_CATEGORY_TYPES.EXPENSE
  );
};

/*===========================================================
  isSavingsCategory
===========================================================*/
export const isSavingsCategory = (
  category
) => {
  return (
    category?.type ===
    BUDGET_CATEGORY_TYPES.SAVINGS
  );
};

/*===========================================================
  isFixedExpenseCategory
===========================================================*/
export const isFixedExpenseCategory = (
  category
) => {
  return (
    isExpenseCategory(
      category
    ) &&
    category?.expenseType ===
    EXPENSE_TYPES.FIXED
  );
};

/*===========================================================
  isVariableExpenseCategory
===========================================================*/
export const isVariableExpenseCategory =
  (
    category
  ) => {
    return (
      isExpenseCategory(
        category
      ) &&
      category?.expenseType ===
      EXPENSE_TYPES.VARIABLE
    );
  };