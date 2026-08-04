import React from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  ChevronRightIcon,
} from '../../../../components/icons/Icons';

/*===========================================================
  BudgetMonthHeader:
  => Displays the breadcrumb, month title, refresh indicator,
     and background refresh errors.
===========================================================*/
const BudgetMonthHeader = ({
  monthLabel,
  refreshing = false,
  refreshError = '',
  onRetryRefresh,
}) => {
  return (
    <>
      <header className="mb-6">
        {/*=====================================================
          Breadcrumb
        =====================================================*/}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            to="/budget/months"
            className="font-medium text-[var(--app-primary)] hover:underline"
          >
            Budget Months
          </Link>

          <ChevronRightIcon className="h-4 w-4 text-[var(--app-text-muted)]" />

          <span className="text-[var(--app-text-muted)]">
            {monthLabel}
          </span>
        </div>

        {/*=====================================================
          Header content
        =====================================================*/}
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--app-primary)]">
              Monthly workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--app-text)] sm:text-3xl">
              {monthLabel}
            </h1>

            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              Review income, categories, expenses, bills,
              and monthly totals.
            </p>
          </div>

          {refreshing && (
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-medium text-[var(--app-text-muted)] sm:self-end">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-[var(--app-primary)]" />

              Refreshing...
            </div>
          )}
        </div>
      </header>

      {/*=======================================================
        Background refresh error
      =======================================================*/}
      {refreshError && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-700 dark:text-red-300">
            {refreshError}
          </p>

          <button
            type="button"
            onClick={onRetryRefresh}
            disabled={refreshing}
            className="self-start text-sm font-semibold text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 sm:self-auto"
          >
            Try again
          </button>
        </div>
      )}
    </>
  );
};

export default BudgetMonthHeader;