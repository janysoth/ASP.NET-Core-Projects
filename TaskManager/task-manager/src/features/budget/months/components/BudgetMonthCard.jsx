import React from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  BudgetIcon,
  ChevronRightIcon,
} from '@/components/icons/Icons';

import {
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  formatBudgetMonth:
  => Converts numeric month/year into a readable label.

  Example:
  => 7 / 2026
  => July 2026
===========================================================*/
const formatBudgetMonth = (
  month,
  year
) => {
  if (
    !month ||
    !year
  ) {
    return 'Unknown month';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  ).format(
    new Date(
      year,
      month - 1,
      1
    )
  );
};

/*===========================================================
  BudgetMonthCard:
  => Displays one Budget Month summary card.

  Shows:
  => Month / year.
  => Planned income.
  => Actual income.
  => Expenses.
  => Left to assign.

  IMPORTANT:
  => Edit/Delete actions will be added here later.
===========================================================*/
const BudgetMonthCard = ({
  budgetMonth,
}) => {
  return (
    <Link
      to={`/budget/months/${budgetMonth.id}`}
      className="
        rounded-2xl
        border
        border-[var(--app-border)]
        bg-[var(--app-surface)]
        p-5
        text-left
        shadow-sm

        transition

        hover:-translate-y-0.5
        hover:border-[var(--app-primary)]
        hover:shadow-md
      "
    >
      {/*=======================================================
        Header
      =======================================================*/}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--app-primary)]">
            Budget month
          </p>

          <h2 className="mt-1 text-xl font-bold text-[var(--app-text)]">
            {formatBudgetMonth(
              budgetMonth.month,
              budgetMonth.year
            )}
          </h2>
        </div>

        <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <BudgetIcon className="h-5 w-5" />
        </div>
      </div>

      {/*=======================================================
        Summary Values
      =======================================================*/}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[var(--app-text-muted)]">
            Planned income
          </p>

          <p className="mt-1 text-base font-bold text-[var(--app-text)]">
            {formatCurrency(
              budgetMonth.plannedIncome
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-[var(--app-text-muted)]">
            Actual income
          </p>

          <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(
              budgetMonth.totalIncome
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-[var(--app-text-muted)]">
            Expenses
          </p>

          <p className="mt-1 text-base font-bold text-[var(--app-text)]">
            {formatCurrency(
              budgetMonth.totalExpenses
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-[var(--app-text-muted)]">
            Left to assign
          </p>

          <p className="mt-1 text-base font-bold text-[var(--app-text)]">
            {formatCurrency(
              budgetMonth.leftToAssign
            )}
          </p>
        </div>
      </div>

      {/*=======================================================
        Footer
      =======================================================*/}
      <div className="mt-5 flex items-center justify-between border-t border-[var(--app-border)] pt-4">
        <span className="text-sm font-semibold text-[var(--app-primary)]">
          View budget
        </span>

        <ChevronRightIcon className="h-5 w-5 text-[var(--app-text-muted)]" />
      </div>
    </Link>
  );
};

export default BudgetMonthCard;