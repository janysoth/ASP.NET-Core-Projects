import React from 'react';

import {
  ArrowDownIcon,
} from '@/components/icons/Icons';

import {
  IncomeEmptyState,
  IncomeRow,
} from './components';

/*===========================================================
  BudgetIncomeSection:
  => Displays income records for one budget month.
===========================================================*/
const BudgetIncomeSection = ({
  incomeRecords = [],
  monthLabel,
}) => {
  return (
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Header
      =======================================================*/}
      <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
        <div>
          <h2 className="font-semibold text-[var(--app-text)]">
            Income
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Income assigned to {monthLabel}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <ArrowDownIcon className="h-5 w-5" />
        </div>
      </div>

      {incomeRecords.length === 0 ? (
        <IncomeEmptyState />
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {incomeRecords.map(
            (income) => (
              <IncomeRow
                key={income.id}
                income={income}
              />
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetIncomeSection;