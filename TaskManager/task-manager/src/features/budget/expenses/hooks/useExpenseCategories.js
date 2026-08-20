import {
  useMemo,
} from 'react';

/*===========================================================
  useExpenseCategories:
  => Returns categories that may be used for manual expenses.

  Backend Category Model:

  Type:
  => Expense
  => Savings

  ExpenseType:
  => Fixed
  => Variable

  Allowed for Expense Form:
  => Type = Expense
     AND
     ExpenseType = Fixed or Variable

  Excluded:
  => Savings
  => Debt / any other unsupported category type
===========================================================*/
export const useExpenseCategories = (
  categories = []
) => {
  const expenseCategories =
    useMemo(() => {
      const normalizedCategories =
        Array.isArray(
          categories
        )
          ? categories
          : [];

      return normalizedCategories.filter(
        (
          category
        ) => {
          /*=================================================
            Normalize Backend Category Type
          =================================================*/
          const categoryType =
            String(
              category.type ??
              ''
            )
              .trim()
              .toLowerCase();

          /*=================================================
            Normalize Backend Expense Type
          =================================================*/
          const expenseType =
            String(
              category.expenseType ??
              ''
            )
              .trim()
              .toLowerCase();

          /*=================================================
            Valid Expense Category:
            => Type must be Expense.
            => ExpenseType must be Fixed or Variable.
          =================================================*/
          const isExpense =
            categoryType ===
            'expense';

          const isValidExpenseType =
            expenseType ===
            'fixed' ||
            expenseType ===
            'variable';

          return (
            isExpense &&
            isValidExpenseType
          );
        }
      );
    }, [
      categories,
    ]);

  return {
    expenseCategories,
  };
};