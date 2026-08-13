import React from 'react';

import {
  BudgetIcon,
} from '@/components/icons/Icons';

import {
  CategoryEmptyState,
  CategoryRow,
} from './components';

/*===========================================================
  BudgetCategoriesSection:
  => Displays planned vs actual activity by category.
===========================================================*/
const BudgetCategoriesSection = ({
  categories = [],
}) => {
  return (
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
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

      {categories.length === 0 ? (
        <CategoryEmptyState />
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {categories.map(
            (category) => (
              <CategoryRow
                key={category.id}
                category={category}
              />
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetCategoriesSection;