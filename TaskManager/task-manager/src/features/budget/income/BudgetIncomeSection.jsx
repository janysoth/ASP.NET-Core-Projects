import React from 'react';

import { ArrowDownIcon } from '@/components/icons/Icons';

import {
  formatCurrency,
  formatUtcDate
} from '../utils/budgetFormatters';

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

      {/*=======================================================
        Empty state
      =======================================================*/}
      {incomeRecords.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-semibold text-[var(--app-text)]">
            No income records
          </p>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            There is no income recorded for this month.
          </p>
        </div>
      ) : (
        /*=====================================================
          Income rows
        =====================================================*/
        <div className="divide-y divide-[var(--app-border)]">
          {incomeRecords.map(
            (income) => (
              <div
                key={income.id}
                className="flex items-center gap-4 px-5 py-4"
              >
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
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetIncomeSection;