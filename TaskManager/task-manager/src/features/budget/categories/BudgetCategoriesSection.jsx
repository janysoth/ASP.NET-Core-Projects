import React, {
  useMemo,
  useState,
} from 'react';

import {
  AppSegmentedControl,
} from '@/components/ui';

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
  /*===========================================================
    Filter
    => budgeted = show only categories with planned amounts.
    => all      = show every category.
  ===========================================================*/
  const [
    filter,
    setFilter,
  ] = useState(
    'budgeted'
  );

  /*===========================================================
    Visible Categories
  ===========================================================*/
  const visibleCategories =
    useMemo(() => {
      if (filter === 'all') {
        return categories;
      }

      return categories.filter(
        (category) => {
          const planned =
            Number(
              category.totalPlannedAmount ??
              category.plannedAmount ??
              0
            );

          return planned > 0;
        }
      );
    }, [
      categories,
      filter,
    ]);

  return (
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Header
      =======================================================*/}
      <div className="flex flex-col gap-4 border-b border-[var(--app-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-[var(--app-text)]">
            Budget Categories
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Planned and actual activity by category
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AppSegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              {
                label: 'Budgeted',
                value: 'budgeted',
              },
              {
                label: 'All',
                value: 'all',
              },
            ]}
          />

          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            <BudgetIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/*=======================================================
        Empty State
      =======================================================*/}
      {visibleCategories.length === 0 ? (
        <CategoryEmptyState
          budgetedOnly={
            filter ===
            'budgeted'
          }
        />
      ) : (
        /*=====================================================
          Category Rows
        =====================================================*/
        <div className="divide-y divide-[var(--app-border)]">
          {visibleCategories.map(
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