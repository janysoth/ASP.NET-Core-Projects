import React from 'react';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BudgetIcon,
  WalletIcon,
} from '../../../components/icons/Icons';

import AccountsPanel from '../components/AccountsPanel';
import BudgetProgressPanel from '../components/BudgetProgressPanel';
import RecentTransactionsPanel from '../components/RecentTransactionsPanel';
import SummaryCard from '../components/SummaryCard';
import UpcomingBillsPanel from '../components/UpcomingBillsPanel';

import { useBudgetDashboard } from '../hooks/useBudgetDashboard';

/*===========================================================
  formatBudgetMonth:
  => Converts numeric month and year values into a readable
     month label.

  Example:

  month = 8
  year  = 2026

  Result:

  August 2026
===========================================================*/
const formatBudgetMonth = (
  month,
  year
) => {
  if (!month || !year) {
    return 'Unknown month';
  }

  const date =
    new Date(
      year,
      month - 1,
      1
    );

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  ).format(date);
};

/*===========================================================
  formatCurrency:
  => Formats a numeric value as US currency.

  Examples:

  6500 -> $6,500.00
  0    -> $0.00
===========================================================*/
const formatCurrency = (value) => {
  const numericValue =
    Number(value ?? 0);

  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
    }
  ).format(numericValue);
};

/*===========================================================
  BudgetDashboardPage:
  => Displays the main budget dashboard.
  => Loads available budget months from the backend.
  => Reloads dashboard data when the selected month changes.
  => Displays live cash-flow values from the dashboard API.
===========================================================*/
const BudgetDashboardPage = () => {
  const {
    budgetMonths,
    selectedBudgetMonth,
    selectedBudgetMonthId,
    setSelectedBudgetMonthId,

    dashboardSummary,
    accounts,
    bills,
    transactions,

    loading,
    error,
    refreshDashboard,
  } = useBudgetDashboard();

  /*===========================================================
    Loading state
  ===========================================================*/
  if (loading) {
    return (
      <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--app-border)] border-t-[var(--app-primary)]" />

            <p className="mt-4 text-sm font-medium text-[var(--app-text-muted)]">
              Loading budget dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*===========================================================
    Error state
  ===========================================================*/
  if (error) {
    return (
      <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10">
          <h1 className="text-lg font-semibold text-red-700 dark:text-red-300">
            Unable to load the dashboard
          </h1>

          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={refreshDashboard}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /*===========================================================
    Empty budget-month state
  ===========================================================*/
  if (budgetMonths.length === 0) {
    return (
      <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            <BudgetIcon className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[var(--app-text)]">
            No budget months found
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-text-muted)]">
            Create your first budget month before loading the
            dashboard.
          </p>
        </div>
      </div>
    );
  }

  const selectedMonthLabel =
    selectedBudgetMonth
      ? formatBudgetMonth(
        selectedBudgetMonth.month,
        selectedBudgetMonth.year
      )
      : 'the selected month';

  const plannedIncome =
    dashboardSummary?.cashFlow?.plannedIncome;

  const actualIncome =
    dashboardSummary?.cashFlow?.actualIncome;

  const actualExpenses =
    dashboardSummary?.cashFlow?.actualExpenses;

  const netCashFlow =
    dashboardSummary?.cashFlow?.netCashFlow;

  return (
    <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/*=======================================================
        Dashboard header
      =======================================================*/}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--app-primary)]">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--app-text)] sm:text-3xl">
            Budget Dashboard
          </h1>

          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Track your monthly budget, bills, balances, and
            recent activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="budget-month"
            className="sr-only"
          >
            Select budget month
          </label>

          <select
            id="budget-month"
            value={selectedBudgetMonthId}
            onChange={(event) =>
              setSelectedBudgetMonthId(
                event.target.value
              )
            }
            className="min-w-[180px] rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20"
          >
            {budgetMonths.map(
              (budgetMonth) => (
                <option
                  key={budgetMonth.id}
                  value={budgetMonth.id}
                >
                  {formatBudgetMonth(
                    budgetMonth.month,
                    budgetMonth.year
                  )}
                </option>
              )
            )}
          </select>
        </div>
      </header>

      {/*=======================================================
        Live summary cards
      =======================================================*/}
      <section className="app-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Planned income"
          value={formatCurrency(
            plannedIncome
          )}
          helperText={`Expected income for ${selectedMonthLabel}`}
          icon={BudgetIcon}
          tone="primary"
        />

        <SummaryCard
          title="Actual income"
          value={formatCurrency(
            actualIncome
          )}
          helperText="Income recorded this month"
          icon={ArrowDownIcon}
          tone="positive"
        />

        <SummaryCard
          title="Total expenses"
          value={formatCurrency(
            actualExpenses
          )}
          helperText="Fixed and variable spending"
          icon={ArrowUpIcon}
          tone="danger"
        />

        <SummaryCard
          title="Remaining balance"
          value={formatCurrency(
            netCashFlow
          )}
          helperText="Actual income minus expenses"
          icon={WalletIcon}
          tone="warning"
        />
      </section>

      {/*=======================================================
        Dashboard panels

        These panels still use placeholder values.

        We will connect them to the API one panel at a time.
      =======================================================*/}
      <section className="app-section-gap mt-6 grid gap-6 xl:grid-cols-2">
        <AccountsPanel
          accounts={accounts}
        />

        <UpcomingBillsPanel
          bills={bills}
        />
      </section>

      <section className="app-section-gap mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <BudgetProgressPanel />

        <RecentTransactionsPanel
          transactions={transactions}
        />
      </section>
    </div>
  );
};

export default BudgetDashboardPage;