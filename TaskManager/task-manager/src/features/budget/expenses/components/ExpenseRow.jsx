import React from 'react';

import {
  ArrowUpIcon,
} from '@/components/icons/Icons';

import {
  FinancialTableRow,
} from '@/features/budget/components';

import {
  formatCurrency,
  formatUtcDate,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  ExpenseRow:
  => Displays one expense record using the shared
     FinancialTableRow layout.

  Desktop / tablet:
  => Expense | Amount | Date

  Mobile:
  => Financial values stack below the expense description.
===========================================================*/
const ExpenseRow = ({
  expense,
  columns = [],
}) => {
  return (
    <FinancialTableRow
      columns={columns}
    >
      {/*=====================================================
        Expense Column
      =====================================================*/}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
          <ArrowUpIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--app-text)]">
            {expense.name}
          </p>

          <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
            {expense.categoryName ||
              'Unknown category'}

            {expense.accountName
              ? ` · ${expense.accountName}`
              : ''}
          </p>
        </div>
      </div>

      {/*=====================================================
        Amount Column
      =====================================================*/}
      <div className="text-left md:text-right">
        <p className="text-xs text-[var(--app-text-muted)] md:hidden">
          Amount
        </p>

        <p className="mt-1 text-sm font-bold text-red-600 dark:text-red-400 md:mt-0">
          {formatCurrency(
            expense.amount
          )}
        </p>
      </div>

      {/*=====================================================
        Date Column
      =====================================================*/}
      <div className="text-left md:text-right">
        <p className="text-xs text-[var(--app-text-muted)] md:hidden">
          Date
        </p>

        <p className="mt-1 text-sm font-medium text-[var(--app-text)] md:mt-0">
          {formatUtcDate(
            expense.expenseDate
          )}
        </p>
      </div>
    </FinancialTableRow>
  );
};

export default ExpenseRow;