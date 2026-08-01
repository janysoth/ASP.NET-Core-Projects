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

const BudgetDashboardPage = () => {
  return (
    <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--app-primary)]">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--app-text)] sm:text-3xl">
            Budget Dashboard
          </h1>

          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Track your monthly budget, bills, balances, and recent activity.
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
            defaultValue="2026-08"
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20"
          >
            <option value="2026-08">
              August 2026
            </option>

            <option value="2026-09">
              September 2026
            </option>

            <option value="2026-10">
              October 2026
            </option>
          </select>
        </div>
      </header>

      <section className="app-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Planned income"
          value="$7,500.00"
          helperText="Expected income for August"
          icon={BudgetIcon}
          tone="primary"
        />

        <SummaryCard
          title="Actual income"
          value="$3,600.00"
          helperText="Income recorded this month"
          icon={ArrowDownIcon}
          tone="positive"
        />

        <SummaryCard
          title="Total expenses"
          value="$2,500.00"
          helperText="Fixed and variable spending"
          icon={ArrowUpIcon}
          tone="danger"
        />

        <SummaryCard
          title="Remaining balance"
          value="$1,100.00"
          helperText="Actual income minus expenses"
          icon={WalletIcon}
          tone="warning"
        />
      </section>

      <section className="app-section-gap mt-6 grid gap-6 xl:grid-cols-2">
        <AccountsPanel />

        <UpcomingBillsPanel />
      </section>

      <section className="app-section-gap mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <BudgetProgressPanel />

        <RecentTransactionsPanel />
      </section>
    </div>
  );
};

export default BudgetDashboardPage;