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
  FINANCIAL_TABLE_GAP,
  MONEY_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
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
===========================================================*/
const BudgetCategoriesSection = ({
  categories = [],
}) => {
  const [
    filter,
    setFilter,
  ] = useState(
    'budgeted'
  );

  /*===========================================================
    Visible Categories:
    => All returns every category.
    => Budgeted only returns categories that have money
       assigned for the month.
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
    Financial Table Columns
  ===========================================================*/
  const tableColumns =
    useMemo(
      () => [
        {
          key: 'category',
          label: 'Category',
          className:
            'min-w-0 flex-1',
        },
        {
          key: 'remaining',
          label: 'Remaining',
          className: `${MONEY_COLUMN_WIDTH} text-right`,
        },
        {
          key: 'status',
          label: 'Status',
          className: `${STATUS_COLUMN_WIDTH} text-right`,
        },
      ],
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
        Table Header
      =======================================================*/}
      {visibleCategories.length >
        0 && (
          <FinancialTableHeader
            columns={
              tableColumns
            }
            className={
              FINANCIAL_TABLE_GAP
            }
          />
        )}

      {/*=======================================================
        Empty State
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
        /*=====================================================
          Category Rows
        =====================================================*/
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
              />
            )
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetCategoriesSection;