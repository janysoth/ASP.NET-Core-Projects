import React from 'react';

import {
  BudgetIcon,
  PlusIcon,
} from '@/components/icons/Icons';

import {
  AppButton,
} from '@/components/ui';

/*===========================================================
  BudgetMonthEmptyState:
  => Displays when the user has no budget months yet.

  Handles:
  => Empty-state icon.
  => Guidance text.
  => Create Budget Month action.

  IMPORTANT:
  => Parent page owns the create workflow.
===========================================================*/
const BudgetMonthEmptyState = ({
  onCreateBudgetMonth,
}) => {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
        <BudgetIcon className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-xl font-bold text-[var(--app-text)]">
        No budget months found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-text-muted)]">
        Create your first budget month to begin planning
        income, expenses, savings, and bills.
      </p>

      <div className="mt-6 flex justify-center">
        <AppButton
          variant="primary"
          onClick={
            onCreateBudgetMonth
          }
        >
          <PlusIcon className="h-4 w-4" />

          <span>
            Create budget month
          </span>
        </AppButton>
      </div>
    </div>
  );
};

export default BudgetMonthEmptyState;