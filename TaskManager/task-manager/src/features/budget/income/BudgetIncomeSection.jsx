import React, {
  useMemo,
} from 'react';

import {
  ArrowDownIcon,
} from '@/components/icons/Icons';

import {
  FinancialTableHeader,
} from '@/features/budget/components';

import {
  createFinancialColumns,
} from '@/features/budget/utils/layout';

import {
  IncomeEmptyState,
  IncomeRow,
} from './components';

/*===========================================================
  BudgetIncomeSection:
  => Displays income records for one budget month.

  Layout:
  => Description column uses remaining space.
  => Amount and Date use fixed widths on the right.
===========================================================*/
const BudgetIncomeSection = ({
  incomeRecords = [],
  monthLabel,
}) => {
  const tableColumns =
    useMemo(
      () =>
        createFinancialColumns([
          {
            key: 'income',
            label: 'Income',
          },
          {
            key: 'amount',
            label: 'Amount',
          },
          {
            key: 'date',
            label: 'Date',
          },
        ]),
      []
    );

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Section Header
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
        Financial Table Header
      =======================================================*/}
      {incomeRecords.length > 0 && (
        <FinancialTableHeader
          columns={
            tableColumns
          }
        />
      )}

      {/*=======================================================
        Empty State / Income Rows
      =======================================================*/}
      {incomeRecords.length === 0 ? (
        <IncomeEmptyState />
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {incomeRecords.map(
            (income) => (
              <IncomeRow
                key={income.id}
                income={income}
                columns={tableColumns}
              />
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetIncomeSection;