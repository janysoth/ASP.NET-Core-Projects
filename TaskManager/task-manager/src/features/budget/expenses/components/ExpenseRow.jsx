import React from 'react';

import {
  ArrowUpIcon,
} from '@/components/icons/Icons';

import {
  formatCurrency,
  formatUtcDate,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  ExpenseRow:
  => Displays one expense record.
===========================================================*/
const ExpenseRow = ({
  expense,
}) => {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
        <ArrowUpIcon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--app-text)]">
          {expense.name}
        </p>

        <p className="truncate text-xs text-[var(--app-text-muted)]">
          {expense.categoryName ||
            'Unknown category'}

          {expense.accountName
            ? ` · ${expense.accountName}`
            : ''}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-red-600 dark:text-red-400">
          {formatCurrency(
            expense.amount
          )}
        </p>

        <p className="text-xs text-[var(--app-text-muted)]">
          {formatUtcDate(
            expense.expenseDate
          )}
        </p>
      </div>
    </div>
  );
};

export default ExpenseRow;