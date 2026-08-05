import React, {
  useMemo
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import BudgetMonthHeader from '../components/BudgetMonthHeader';
import BudgetMonthSummary from '../components/BudgetMonthSummary';

import {
  formatBudgetMonth,
} from '../../utils/budgetFormatters';

import {
  sortBudgetCategories,
  sortExpenseRecords,
  sortIncomeRecords,
} from '../utils/budgetMonthUtils';

import BudgetBillsSection from '../components/bills/BudgetBillsSection';
import BudgetCategoriesSection from '../components/BudgetCategoriesSection';
import BudgetExpenseSection from '../components/BudgetExpenseSection';
import BudgetIncomeSection from '../components/BudgetIncomeSection';
import { useBudgetMonthDetails } from '../hooks/useBudgetMonthDetails';

/*===========================================================
  BudgetMonthDetailsPage:
  => Displays one complete budget month.
  => Loads income, categories, expenses, and bills.
  => This version is read-only.
===========================================================*/
const BudgetMonthDetailsPage = () => {
  const {
    budgetMonthId,
  } = useParams();

  const {
    budgetMonth,
    loading,
    refreshing,
    error,
    refreshError,
    refreshBudgetMonth,
  } = useBudgetMonthDetails(
    budgetMonthId
  );

  /*===========================================================
    Sorted income records
  ===========================================================*/
  const sortedIncomeRecords =
    useMemo(
      () =>
        sortIncomeRecords(
          budgetMonth?.incomeRecords
        ),
      [
        budgetMonth?.incomeRecords,
      ]
    );

  /*===========================================================
    Sorted expense records
  ===========================================================*/
  const sortedExpenseRecords =
    useMemo(
      () =>
        sortExpenseRecords(
          budgetMonth?.expenseRecords
        ),
      [
        budgetMonth?.expenseRecords,
      ]
    );

  /*===========================================================
    Sorted categories
  ===========================================================*/
  const sortedCategories =
    useMemo(
      () =>
        sortBudgetCategories(
          budgetMonth?.budgetCategories
        ),
      [
        budgetMonth?.budgetCategories,
      ]
    );

  /*===========================================================
    Loading state
  ===========================================================*/
  if (loading) {
    return (
      <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--app-border)] border-t-[var(--app-primary)]" />

            <p className="mt-4 text-sm font-medium text-[var(--app-text-muted)]">
              Loading budget month...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*===========================================================
    Error state
  ===========================================================*/
  if (error) {
    return (
      <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10">
          <h1 className="text-lg font-semibold text-red-700 dark:text-red-300">
            Unable to load budget month
          </h1>

          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>

          <Link
            to="/budget/months"
            className="mt-4 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Back to budget months
          </Link>
        </div>
      </div>
    );
  }

  if (!budgetMonth) {
    return null;
  }

  const monthLabel =
    formatBudgetMonth(
      budgetMonth.month,
      budgetMonth.year
    );

  return (
    <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/*=======================================================
        Breadcrumb and header
      =======================================================*/}
      <BudgetMonthHeader
        monthLabel={monthLabel}
        refreshing={refreshing}
        refreshError={refreshError}
        onRetryRefresh={
          refreshBudgetMonth
        }
      />

      {/*=======================================================
        Budget Month Summary
      =======================================================*/}
      <BudgetMonthSummary
        budgetMonth={budgetMonth}
        monthLabel={monthLabel}
      />

      {/*=======================================================
        Bills
      =======================================================*/}
      <BudgetBillsSection
        budgetMonthId={budgetMonth.id}
        categories={
          budgetMonth.budgetCategories ?? []
        }
        month={budgetMonth.month}
        year={budgetMonth.year}
        monthLabel={monthLabel}
        onBudgetMonthChanged={
          refreshBudgetMonth
        }
      />

      {/*=======================================================
        Income records
      =======================================================*/}
      <BudgetIncomeSection
        incomeRecords={sortedIncomeRecords}
        monthLabel={monthLabel}
      />

      {/*=======================================================
        Budget categories
      =======================================================*/}
      <BudgetCategoriesSection
        categories={sortedCategories}
      />

      {/*=======================================================
        Expense records
      =======================================================*/}
      <BudgetExpenseSection
        expenseRecords={sortedExpenseRecords}
        monthLabel={monthLabel}
      />

    </div>
  );
};

export default BudgetMonthDetailsPage;