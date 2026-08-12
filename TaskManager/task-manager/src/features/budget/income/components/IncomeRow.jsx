import React from 'react';

import {
  ArrowDownIcon,
} from '@/components/icons/Icons';

import {
  formatCurrency,
  formatUtcDate,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  IncomeRow:
  => Displays one income record.
===========================================================*/
const IncomeRow = ({
  income,
}) => {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <ArrowDownIcon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--app-text)]">
          {income.source}
        </p>

        <p className="truncate text-xs text-[var(--app-text-muted)]">
          {income.accountName ||
            'Unknown account'}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(
            income.amount
          )}
        </p>

        <p className="text-xs text-[var(--app-text-muted)]">
          {formatUtcDate(
            income.incomeDate
          )}
        </p>
      </div>
    </div>
  );
};

export default IncomeRow;