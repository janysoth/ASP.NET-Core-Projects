import React from 'react';

import {
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

import {
  FINANCIAL_TABLE_GAP,
  MONEY_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
} from '@/features/budget/utils/layout';

/*===========================================================
  CategoryRow:
  => Displays one budget category using the shared
     financial-table column layout.

  Desktop:
  => Category | Remaining | Status

  Mobile:
  => Financial values stack below the category information
     and include their own labels.
===========================================================*/
const CategoryRow = ({
  category,
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
    <div
      className={`
        flex
        flex-col
        gap-4
        px-5
        py-4

        md:flex-row
        md:items-center
        ${FINANCIAL_TABLE_GAP}
      `}
    >
      {/*=====================================================
        Category Column
      =====================================================*/}
      <div className="min-w-0 flex-1">
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
        Financial Columns
      =====================================================*/}
      <div
        className={`
          flex
          shrink-0
          items-start
          ${FINANCIAL_TABLE_GAP}
        `}
      >
        {/*===================================================
          Remaining Column
        ===================================================*/}
        <div
          className={`
            ${MONEY_COLUMN_WIDTH}
            text-right
          `}
        >
          <p className="text-xs text-[var(--app-text-muted)] md:hidden">
            Remaining
          </p>

          <p
            className={`
              text-sm
              font-bold

              ${isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : 'text-[var(--app-text)]'
              }

              max-md:mt-1
            `}
          >
            {formatCurrency(
              remainingAmount
            )}
          </p>
        </div>

        {/*===================================================
          Status Column
        ===================================================*/}
        <div
          className={`
            ${STATUS_COLUMN_WIDTH}
            text-right
          `}
        >
          <p className="text-xs text-[var(--app-text-muted)] md:hidden">
            Status
          </p>

          <p
            className={`
              text-sm
              font-semibold

              ${isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'
              }

              max-md:mt-1
            `}
          >
            {isOverBudget
              ? 'Over budget'
              : 'On track'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryRow;