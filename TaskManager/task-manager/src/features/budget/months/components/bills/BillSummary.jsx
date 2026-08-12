import React from 'react';

import {
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  BillSummary:
  => Displays monthly bill totals.

  Shows:
  => Total bills.
  => Paid bills.
  => Unpaid bills.
  => Expected amount.
  => Remaining amount.

  IMPORTANT:
  => Calculation logic lives in useBillSummary.
  => This component only renders the summary.
===========================================================*/
const BillSummary = ({
  summary,
}) => {
  return (
    <div className="grid grid-cols-2 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 sm:grid-cols-5">
      <div className="px-4 py-3 text-center">
        <p className="text-xs text-[var(--app-text-muted)]">
          Total
        </p>

        <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
          {summary.totalBills}
        </p>
      </div>

      <div className="border-l border-[var(--app-border)] px-4 py-3 text-center">
        <p className="text-xs text-[var(--app-text-muted)]">
          Paid
        </p>

        <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {summary.paidBills}
        </p>
      </div>

      <div className="border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-l sm:border-t-0">
        <p className="text-xs text-[var(--app-text-muted)]">
          Unpaid
        </p>

        <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
          {summary.unpaidBills}
        </p>
      </div>

      <div className="border-l border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-t-0">
        <p className="text-xs text-[var(--app-text-muted)]">
          Expected
        </p>

        <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
          {formatCurrency(
            summary.expectedTotal
          )}
        </p>
      </div>

      <div className="col-span-2 border-t border-[var(--app-border)] px-4 py-3 text-center sm:col-span-1 sm:border-l sm:border-t-0">
        <p className="text-xs text-[var(--app-text-muted)]">
          Remaining
        </p>

        <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
          {formatCurrency(
            summary.remainingTotal
          )}
        </p>
      </div>
    </div>
  );
};

export default BillSummary;