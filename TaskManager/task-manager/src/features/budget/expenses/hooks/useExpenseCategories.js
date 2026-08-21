import {
  useMemo,
} from 'react';

import {
  BUDGET_CATEGORY_TYPES,
  EXPENSE_TYPES,
} from '@/features/budget/domain';

/*===========================================================
  useExpenseCategories:
  => Returns categories that may be used for manual expenses.

  Allowed:
  => Budget Category Type = Expense
  => Expense Type = Fixed or Variable

  Excluded:
  => Savings
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
          const categoryType =
            String(
              category.type ??
              ''
            ).trim();

          const expenseType =
            String(
              category.expenseType ??
              ''
            ).trim();

          return (
            categoryType ===
            BUDGET_CATEGORY_TYPES.EXPENSE &&
            (
              expenseType ===
              EXPENSE_TYPES.FIXED ||
              expenseType ===
              EXPENSE_TYPES.VARIABLE
            )
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