import React from 'react';

import {
  FinancialTableRow,
} from '@/features/budget/components';

import {
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  CategoryRow:
  => Displays one budget category using the shared
     FinancialTableRow layout.

  Desktop / tablet:
  => Category | Remaining | Status

  Mobile:
  => Financial values stack below the category information.

  IMPORTANT:
  => Receives the same column-definition array used by
     FinancialTableHeader so header and rows stay aligned.
===========================================================*/
const CategoryRow = ({
  category,
  columns = [],
}) => {
  const plannedAmount =
    Number(
      category.totalPlannedAmount ??
      category.plannedAmount ??
      0
    );

  const spentAmount =
    Number(
      category.spentAmount ??
      0
    );

  const remainingAmount =
    Number(
      category.remainingAmount ??
      plannedAmount -
      spentAmount
    );

  const isOverBudget =
    Boolean(
      category.isOverBudget
    ) ||
    remainingAmount < 0;

  return (
    <FinancialTableRow
      columns={columns}
    >
      {/*=====================================================
        Category Column
      =====================================================*/}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-[var(--app-text)]">
            {category.name}
          </p>

          <span className="shrink-0 whitespace-nowrap rounded-full bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--app-text-muted)]">
            {category.type}

            {category.expenseType
              ? ` · ${category.expenseType}`
              : ''}
          </span>
        </div>

        <p className="mt-1 text-xs text-[var(--app-text-muted)]">
          {formatCurrency(
            spentAmount
          )}{' '}
          spent of{' '}
          {formatCurrency(
            plannedAmount
          )}
        </p>
      </div>

      {/*=====================================================
        Remaining Column
      =====================================================*/}
      <div className="text-left md:text-right">
        <p className="text-xs text-[var(--app-text-muted)] md:hidden">
          Remaining
        </p>

        <p
          className={`mt-1 text-sm font-bold md:mt-0 ${isOverBudget
            ? 'text-red-600 dark:text-red-400'
            : 'text-[var(--app-text)]'
            }`}
        >
          {formatCurrency(
            remainingAmount
          )}
        </p>
      </div>

      {/*=====================================================
        Status Column
      =====================================================*/}
      <div className="text-left md:text-right">
        <p className="text-xs text-[var(--app-text-muted)] md:hidden">
          Status
        </p>

        <p
          className={`mt-1 text-sm font-semibold md:mt-0 ${isOverBudget
            ? 'text-red-600 dark:text-red-400'
            : 'text-emerald-600 dark:text-emerald-400'
            }`}
        >
          {isOverBudget
            ? 'Over budget'
            : 'On track'}
        </p>
      </div>
    </FinancialTableRow>
  );
};

export default CategoryRow;