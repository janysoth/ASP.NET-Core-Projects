import React from 'react';

import {
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  formatDifference:
  => Formats the remaining expense budget.

  Examples:
  => $800.00   = under budget
  => $0.00     = exactly on budget
  => -$600.00  = over budget
===========================================================*/
const formatDifference = (
  difference
) => {
  return formatCurrency(
    difference
  );
};

/*===========================================================
  ExpenseSummary:
  => Displays a concise monthly expense summary.

  Columns:
  => Transactions.
  => Planned.
  => Total Expenses.
  => Difference.

  Difference:
  => Positive = under budget, green.
  => Zero     = exactly on budget, neutral.
  => Negative = over budget, red.
===========================================================*/
const ExpenseSummary = ({
  transactionCount = 0,
  plannedExpenses = 0,
  totalExpenses = 0,
}) => {
  const normalizedPlannedExpenses =
    Number(
      plannedExpenses ??
      0
    );

  const normalizedTotalExpenses =
    Number(
      totalExpenses ??
      0
    );

  /*===========================================================
    Difference:
    => Planned minus actual expenses.

    Example:
    Planned = $5,000
    Actual  = $4,200

    Difference:
    $5,000 - $4,200 = $800 remaining
  ===========================================================*/
  const difference =
    normalizedPlannedExpenses -
    normalizedTotalExpenses;

  const differenceClassName =
    difference > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : difference < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-[var(--app-text)]';

  return (
    <div className="grid grid-cols-2 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 sm:grid-cols-4">
      {/*=====================================================
        Transactions
      =====================================================*/}
      <div className="px-4 py-3 text-center">
        <p className="text-xs text-[var(--app-text-muted)]">
          Transactions
        </p>

        <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
          {transactionCount}
        </p>
      </div>

      {/*=====================================================
        Planned
      =====================================================*/}
      <div className="border-l border-[var(--app-border)] px-4 py-3 text-center">
        <p className="text-xs text-[var(--app-text-muted)]">
          Planned
        </p>

        <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
          {formatCurrency(
            normalizedPlannedExpenses
          )}
        </p>
      </div>

      {/*=====================================================
        Total Expenses
      =====================================================*/}
      <div className="border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-l sm:border-t-0">
        <p className="text-xs text-[var(--app-text-muted)]">
          Total Expenses
        </p>

        <p className="mt-1 text-sm font-bold text-red-600 dark:text-red-400">
          {formatCurrency(
            normalizedTotalExpenses
          )}
        </p>
      </div>

      {/*=====================================================
        Difference
      =====================================================*/}
      <div className="border-l border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-t-0">
        <p className="text-xs text-[var(--app-text-muted)]">
          Difference
        </p>

        <p
          className={`mt-1 text-sm font-bold ${differenceClassName}`}
        >
          {formatDifference(
            difference
          )}
        </p>
      </div>
    </div>
  );
};

export default ExpenseSummary;