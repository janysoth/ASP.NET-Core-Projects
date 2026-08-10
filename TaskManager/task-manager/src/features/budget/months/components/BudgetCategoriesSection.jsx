import React from 'react';

import {
  BudgetIcon,
} from '../../../../components/icons/Icons';

import {
  formatCurrency,
} from '../../utils/budgetFormatters';

/*===========================================================
  BudgetCategoriesSection:
  => Displays planned vs actual activity by category.
===========================================================*/
const BudgetCategoriesSection = ({
  categories = [],
}) => {
  return (
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Header
      =======================================================*/}
      <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
        <div>
          <h2 className="font-semibold text-[var(--app-text)]">
            Budget categories
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Planned and actual activity by category
          </p>
        </div>

        <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <BudgetIcon className="h-5 w-5" />
        </div>
      </div>

      {/*=======================================================
        Empty state
      =======================================================*/}
      {categories.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-semibold text-[var(--app-text)]">
            No categories
          </p>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            There are no categories in this budget month.
          </p>
        </div>
      ) : (
        /*=====================================================
          Category rows
        =====================================================*/
        <div className="divide-y divide-[var(--app-border)]">
          {categories.map(
            (category) => (
              <div
                key={category.id}
                className="px-5 py-4"
              >
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

                  <div className="grid grid-cols-2 gap-6 text-right">
                    <div>
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

                    <div>
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
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetCategoriesSection;