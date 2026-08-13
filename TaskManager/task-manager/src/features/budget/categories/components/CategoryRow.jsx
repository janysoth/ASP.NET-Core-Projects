import React from 'react';

import {
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  CategoryRow:
  => Displays one budget category.
===========================================================*/
const CategoryRow = ({
  category,
}) => {
  return (
    <div className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[var(--app-text)]">
              {category.name}
            </p>

            <span className="rounded-full bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--app-text-muted)]">
              {category.type}

              {category.expenseType
                ? ` · ${category.expenseType}`
                : ''}
            </span>
          </div>

          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
            {formatCurrency(
              category.spentAmount
            )}{' '}
            spent of{' '}
            {formatCurrency(
              category.totalPlannedAmount
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-8">
          {/* Remaining */}
          <div className="w-28 text-right">
            <p className="text-xs text-[var(--app-text-muted)]">
              Remaining
            </p>

            <p
              className={`mt-1 text-sm font-bold ${category.isOverBudget
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-[var(--app-text)]'
                }`}
            >
              {formatCurrency(
                category.remainingAmount
              )}
            </p>
          </div>

          {/* Status */}
          <div className="w-20 text-right">
            <p className="text-xs text-[var(--app-text-muted)]">
              Status
            </p>

            <p
              className={`mt-1 text-sm font-semibold ${category.isOverBudget
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
                }`}
            >
              {category.isOverBudget
                ? 'Over budget'
                : 'On track'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryRow;