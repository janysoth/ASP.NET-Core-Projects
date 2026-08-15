import React from 'react';

import {
  ArrowDownIcon,
} from '@/components/icons/Icons';

import {
  FinancialTableRow,
} from '@/features/budget/components';

import {
  formatCurrency,
  formatUtcDate,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  IncomeRow:
  => Displays one income record using the shared
     FinancialTableRow layout.

  Desktop / tablet:
  => Income | Amount | Date

  Mobile:
  => Financial values stack below the description.
===========================================================*/
const IncomeRow = ({
  income,
  columns = [],
}) => {
  return (
    <FinancialTableRow
      columns={columns}
    >
      {/*=====================================================
        Income Column
      =====================================================*/}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <ArrowDownIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--app-text)]">
            {income.source}
          </p>

          <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
            {income.accountName ||
              'Unknown account'}
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

        <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 md:mt-0">
          {formatCurrency(
            income.amount
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
            income.incomeDate
          )}
        </p>
      </div>
    </FinancialTableRow>
  );
};

export default IncomeRow;