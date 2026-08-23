import React from 'react';

import {
  PlusIcon,
} from '@/components/icons/Icons';

import {
  AppButton,
} from '@/components/ui';

/*===========================================================
  BudgetMonthsHeader:
  => Displays the Budget Months page heading.

  Handles:
  => Page title.
  => Page subtitle.
  => Create Budget Month action.

  IMPORTANT:
  => Does not own modal state.
  => Parent page controls the create workflow.
===========================================================*/
const BudgetMonthsHeader = ({
  onCreateBudgetMonth,
}) => {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[var(--app-primary)]">
          Budget planning
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--app-text)] sm:text-3xl">
          Budget Months
        </h1>

        <p className="mt-2 text-sm text-[var(--app-text-muted)]">
          Review and manage your monthly budget plans.
        </p>
      </div>

      <AppButton
        variant="primary"
        onClick={
          onCreateBudgetMonth
        }
      >
        <PlusIcon className="h-5 w-5" />

        <span>
          Create budget month
        </span>
      </AppButton>
    </header>
  );
};

export default BudgetMonthsHeader;