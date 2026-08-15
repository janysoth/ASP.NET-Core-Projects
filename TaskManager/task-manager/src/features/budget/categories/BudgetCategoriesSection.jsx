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
  FinancialSection,
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
  => Shared FinancialSection layout.
  => Shared FinancialTableRow through CategoryRow.

  Layout:
  => Category | Remaining | Status
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
    Financial Table Columns
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

  /*===========================================================
    Section Actions
  ===========================================================*/
  const sectionActions = (
    <>
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
    </>
  );

  return (
    <FinancialSection
      title="Budget Categories"
      subtitle="Planned and actual activity by category"
      columns={
        visibleCategories.length >
          0
          ? tableColumns
          : []
      }
      actions={
        sectionActions
      }
    >
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
    </FinancialSection>
  );
};

export default BudgetCategoriesSection;