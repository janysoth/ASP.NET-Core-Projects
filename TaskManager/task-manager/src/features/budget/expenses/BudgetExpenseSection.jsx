import React from 'react';

import {
  ArrowUpIcon,
} from '@/components/icons/Icons';

import {
  ExpenseEmptyState,
  ExpenseRow,
} from './components';

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

      {expenseRecords.length === 0 ? (
        <ExpenseEmptyState />
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {expenseRecords.map(
            (expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
              />
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetExpenseSection;