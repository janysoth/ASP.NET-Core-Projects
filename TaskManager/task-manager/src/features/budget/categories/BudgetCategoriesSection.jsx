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
  FinancialTableHeader,
} from '@/features/budget/components';

import {
  createFinancialColumns,
} from '@/features/budget/utils/layout';

import {
  CategoryEmptyState,
  CategoryRow,
} from './components';

/*===========================================================
  Category Filter Options
===========================================================*/
const CATEGORY_FILTER_OPTIONS = [
  {
    label: 'Budgeted',
    value: 'budgeted',
  },
  {
    label: 'All',
    value: 'all',
  },
];

/*===========================================================
  BudgetCategoriesSection:
  => Displays planned vs actual activity by category.

  Supports:
  => Budgeted-only view.
  => All-category view.
  => Shared financial-table layout.

  Layout:
  => Category takes all remaining space.
  => Remaining uses a fixed money column width.
  => Status uses a fixed status column width.
===========================================================*/
const BudgetCategoriesSection = ({
  categories = [],
}) => {
  /*===========================================================
    Filter
  ===========================================================*/
  const [
    filter,
    setFilter,
  ] = useState(
    'budgeted'
  );

  /*===========================================================
    Visible Categories:
    => All returns every category.
    => Budgeted returns categories with money assigned.
  ===========================================================*/
  const visibleCategories =
    useMemo(() => {
      if (
        filter ===
        'all'
      ) {
        return categories;
      }

      return categories.filter(
        (
          category
        ) => {
          const plannedAmount =
            Number(
              category.totalPlannedAmount ??
              category.plannedAmount ??
              0
            );

          return (
            plannedAmount >
            0
          );
        }
      );
    }, [
      categories,
      filter,
    ]);

  /*===========================================================
    Financial Table Columns:
    => Description/category takes remaining space.
    => Other columns are fixed-width from the right.
  ===========================================================*/
  const tableColumns =
    useMemo(
      () =>
        createFinancialColumns([
          {
            key: 'category',
            label: 'Category',
          },
          {
            key: 'remaining',
            label: 'Remaining',
          },
          {
            key: 'status',
            label: 'Status',
          },
        ]),
      []
    );

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Section Header
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
            options={
              CATEGORY_FILTER_OPTIONS
            }
            value={
              filter
            }
            onChange={
              setFilter
            }
          />

          <div className="hidden rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 sm:block">
            <BudgetIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/*=======================================================
        Financial Table Header
      =======================================================*/}
      {visibleCategories.length >
        0 && (
          <FinancialTableHeader
            columns={
              tableColumns
            }
          />
        )}

      {/*=======================================================
        Empty State / Category Rows
      =======================================================*/}
      {visibleCategories.length ===
        0 ? (
        <CategoryEmptyState
          budgetedOnly={
            filter ===
            'budgeted'
          }
        />
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {visibleCategories.map(
            (
              category
            ) => (
              <CategoryRow
                key={
                  category.id
                }
                category={
                  category
                }
                columns={
                  tableColumns
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetCategoriesSection;