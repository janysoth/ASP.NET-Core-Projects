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
  FinancialRows,
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

  Uses:
  => FinancialSection for shared card/header layout.
  => FinancialRows for shared row rendering.
  => FinancialTableRow through CategoryRow.

  Supports:
  => Budgeted-only view.
  => All-category view.

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
    => Budgeted returns only categories with money assigned.
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
        visibleCategories.length > 0
          ? tableColumns
          : []
      }
      actions={
        sectionActions
      }
    >
      <FinancialRows
        items={
          visibleCategories
        }
        emptyState={
          <CategoryEmptyState
            budgetedOnly={
              filter ===
              'budgeted'
            }
          />
        }
        renderRow={(
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
        )}
      />
    </FinancialSection>
  );
};

export default BudgetCategoriesSection;