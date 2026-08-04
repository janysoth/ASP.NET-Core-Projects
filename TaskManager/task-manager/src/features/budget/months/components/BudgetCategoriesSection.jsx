import React from 'react';

import {
  ArrowUpIcon,
} from '../../../../components/icons/Icons';

import {
  formatCurrency,
  formatUtcDate,
} from '../../utils/budgetFormatters';

/*===========================================================
  BudgetExpenseSection:
  => Displays expense records for one budget month.
===========================================================*/
const BudgetExpenseSection = ({
  expenseRecords = [],
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
            Expenses
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Expense activity recorded in {monthLabel}
          </p>
        </div>

        <div className="rounded-xl bg-red-100 p-2.5 text-red-700 dark:bg-red-500/15 dark:text-red-300">
          <ArrowUpIcon className="h-5 w-5" />
        </div>
      </div>

      {/*=======================================================
        Empty state
      =======================================================*/}
      {expenseRecords.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-semibold text-[var(--app-text)]">
            No expenses
          </p>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            There are no expenses recorded for this month.
          </p>
        </div>
      ) : (
        /*=====================================================
          Expense rows
        =====================================================*/
        <div className="divide-y divide-[var(--app-border)]">
          {expenseRecords.map(
            (expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-4 px-5 py-4"
              >
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
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetExpenseSection;