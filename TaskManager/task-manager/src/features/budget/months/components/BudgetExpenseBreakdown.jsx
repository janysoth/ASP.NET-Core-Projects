import React from 'react';

import {
  ArrowUpIcon,
  ReceiptIcon,
} from '@/components/icons/Icons';

import {
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  BudgetExpenseBreakdown:
  => Displays planned, spent, and remaining amounts for:
     - Fixed bills
     - Variable expenses

  IMPORTANT:
  => Uses summary values already returned by the backend.
  => Does not calculate totals from individual records.
===========================================================*/
const BudgetExpenseBreakdown = ({
  budgetMonth,
}) => {
  const fixedPlanned =
    Number(
      budgetMonth?.totalPlannedFixedExpenses ??
      0
    );

  const fixedSpent =
    Number(
      budgetMonth?.totalFixedExpenses ??
      0
    );

  const fixedRemaining =
    Number(
      budgetMonth?.remainingFixedExpenseBudget ??
      0
    );

  const variablePlanned =
    Number(
      budgetMonth?.totalPlannedVariableExpenses ??
      0
    );

  const variableSpent =
    Number(
      budgetMonth?.totalVariableExpenses ??
      0
    );

  const variableRemaining =
    Number(
      budgetMonth?.remainingVariableExpenseBudget ??
      0
    );

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Header
      =======================================================*/}
      <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
        <div>
          <h2 className="font-semibold text-[var(--app-text)]">
            Expense breakdown
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Fixed obligations and variable spending for this month
          </p>
        </div>

        <div className="rounded-xl bg-red-100 p-2.5 text-red-700 dark:bg-red-500/15 dark:text-red-300">
          <ArrowUpIcon className="h-5 w-5" />
        </div>
      </div>

      {/*=======================================================
        Breakdown Columns
      =======================================================*/}
      <div className="grid md:grid-cols-2">
        {/*=====================================================
          Fixed Bills
        =====================================================*/}
        <div className="border-b border-[var(--app-border)] p-5 md:border-b-0 md:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <ReceiptIcon className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--app-text)]">
                Fixed bills
              </h3>

              <p className="text-xs text-[var(--app-text-muted)]">
                Monthly fixed obligations
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 text-center">
            {/*=================================================
              Planned
            =================================================*/}
            <div className="flex flex-col items-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Planned
              </p>

              <p className="mt-1 text-lg font-bold text-[var(--app-text)]">
                {formatCurrency(
                  fixedPlanned
                )}
              </p>
            </div>

            {/*=================================================
              Spent
            =================================================*/}
            <div className="flex flex-col items-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Spent
              </p>

              <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(
                  fixedSpent
                )}
              </p>
            </div>

            {/*=================================================
              Remaining
            =================================================*/}
            <div className="flex flex-col items-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Remaining
              </p>

              <p
                className={`mt-1 text-lg font-bold ${fixedRemaining < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[var(--app-text)]'
                  }`}
              >
                {formatCurrency(
                  fixedRemaining
                )}
              </p>
            </div>
          </div>
        </div>

        {/*=====================================================
          Variable Expenses
        =====================================================*/}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
              <ArrowUpIcon className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--app-text)]">
                Variable expenses
              </h3>

              <p className="text-xs text-[var(--app-text-muted)]">
                Flexible monthly spending
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 text-center">
            {/*=================================================
              Planned
            =================================================*/}
            <div className="flex flex-col items-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Planned
              </p>

              <p className="mt-1 text-lg font-bold text-[var(--app-text)]">
                {formatCurrency(
                  variablePlanned
                )}
              </p>
            </div>

            {/*=================================================
              Spent
            =================================================*/}
            <div className="flex flex-col items-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Spent
              </p>

              <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(
                  variableSpent
                )}
              </p>
            </div>

            {/*=================================================
              Remaining
            =================================================*/}
            <div className="flex flex-col items-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Remaining
              </p>

              <p
                className={`mt-1 text-lg font-bold ${variableRemaining < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[var(--app-text)]'
                  }`}
              >
                {formatCurrency(
                  variableRemaining
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BudgetExpenseBreakdown;