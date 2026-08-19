import React from 'react';

import {
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  formatDifference:
  => Formats the difference between actual and planned income.

  Examples:
  => -$500.00
  => $0.00
  => +$500.00
===========================================================*/
const formatDifference = (
  difference
) => {
  if (
    difference > 0
  ) {
    return `+${formatCurrency(
      difference
    )}`;
  }

  return formatCurrency(
    difference
  );
};

/*===========================================================
  IncomeSummary:
  => Displays a concise monthly income summary.

  Columns:
  => Deposits.
  => Planned.
  => Total Income.
  => Difference.

  Difference:
  => Negative = below goal, red.
  => Zero     = exactly on goal, neutral.
  => Positive = above goal, green.
===========================================================*/
const IncomeSummary = ({
  depositCount = 0,
  plannedIncome = 0,
  totalIncome = 0,
}) => {
  const normalizedPlannedIncome =
    Number(
      plannedIncome ??
      0
    );

  const normalizedTotalIncome =
    Number(
      totalIncome ??
      0
    );

  /*===========================================================
    Difference:
    => Actual income minus planned income.

    Example:
    Planned = $6,500
    Actual  = $5,000

    Difference:
    $5,000 - $6,500 = -$1,500
  ===========================================================*/
  const difference =
    normalizedTotalIncome -
    normalizedPlannedIncome;

  const differenceClassName =
    difference > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : difference < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-[var(--app-text)]';

  return (
    <div className="grid grid-cols-2 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 sm:grid-cols-4">
      {/*=====================================================
        Deposits
      =====================================================*/}
      <div className="px-4 py-3 text-center">
        <p className="text-xs text-[var(--app-text-muted)]">
          Deposits
        </p>

        <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
          {depositCount}
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
            normalizedPlannedIncome
          )}
        </p>
      </div>

      {/*=====================================================
        Total Income
      =====================================================*/}
      <div className="border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-l sm:border-t-0">
        <p className="text-xs text-[var(--app-text-muted)]">
          Total Income
        </p>

        <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(
            normalizedTotalIncome
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

export default IncomeSummary;