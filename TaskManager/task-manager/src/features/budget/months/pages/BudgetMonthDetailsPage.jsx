import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BudgetIcon,
  ChevronRightIcon,
  WalletIcon,
} from '../../../../components/icons/Icons';

import BudgetBillsSection from '../components/BudgetBillsSection';

import {
  getBudgetMonthById,
} from '../../dashboard/api/budgetDashboardApi';

import SummaryCard from '../../dashboard/components/SummaryCard';

/*===========================================================
  formatCurrency:
  => Formats numeric values as US currency.
===========================================================*/
const formatCurrency = (value) => {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
    }
  ).format(
    Number(value ?? 0)
  );
};

/*===========================================================
  formatBudgetMonth:
  => Converts numeric month and year values into a readable
     month label.

  Example:

  month = 7
  year  = 2026

  Result:

  July 2026
===========================================================*/
const formatBudgetMonth = (
  month,
  year
) => {
  if (!month || !year) {
    return 'Unknown month';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  ).format(
    new Date(
      year,
      month - 1,
      1
    )
  );
};

/*===========================================================
  formatDate:
  => Formats backend UTC dates without shifting the
     calendar day.
===========================================================*/
const formatDate = (value) => {
  if (!value) {
    return 'No date';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }
  ).format(
    new Date(value)
  );
};

/*===========================================================
  getErrorMessage:
  => Extracts the backend's standard error message.
===========================================================*/
const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Unable to load the budget month.'
  );
};

/*===========================================================
  sortIncomeRecords:
  => Displays newest income dates first.
===========================================================*/
const sortIncomeRecords = (
  incomeRecords = []
) => {
  return [...incomeRecords].sort(
    (first, second) =>
      new Date(second.incomeDate) -
      new Date(first.incomeDate)
  );
};

/*===========================================================
  sortExpenseRecords:
  => Displays newest expense dates first.
===========================================================*/
const sortExpenseRecords = (
  expenseRecords = []
) => {
  return [...expenseRecords].sort(
    (first, second) =>
      new Date(second.expenseDate) -
      new Date(first.expenseDate)
  );
};

/*===========================================================
  sortCategories:
  => Sorts categories by:
     1. Main type
     2. Expense type
     3. Category name
===========================================================*/
const sortCategories = (
  categories = []
) => {
  const typeOrder = {
    Expense: 1,
    Savings: 2,
  };

  const expenseTypeOrder = {
    Fixed: 1,
    Variable: 2,
  };

  return [...categories].sort(
    (first, second) => {
      const mainTypeDifference =
        (typeOrder[first.type] ?? 99) -
        (typeOrder[second.type] ?? 99);

      if (mainTypeDifference !== 0) {
        return mainTypeDifference;
      }

      const expenseTypeDifference =
        (
          expenseTypeOrder[
          first.expenseType
          ] ?? 99
        ) -
        (
          expenseTypeOrder[
          second.expenseType
          ] ?? 99
        );

      if (expenseTypeDifference !== 0) {
        return expenseTypeDifference;
      }

      return first.name.localeCompare(
        second.name
      );
    }
  );
};

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

  const [
    budgetMonth,
    setBudgetMonth,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /*===========================================================
    loadBudgetMonth:
    => Loads the complete selected budget month.
  ===========================================================*/
  useEffect(() => {
    const loadBudgetMonth =
      async () => {
        try {
          setLoading(true);
          setError('');

          const response =
            await getBudgetMonthById(
              budgetMonthId
            );

          setBudgetMonth(
            response
          );
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setLoading(false);
        }
      };

    loadBudgetMonth();
  }, [
    budgetMonthId,
  ]);

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
        sortCategories(
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
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            to="/budget/months"
            className="font-medium text-[var(--app-primary)] hover:underline"
          >
            Budget Months
          </Link>

          <ChevronRightIcon className="h-4 w-4 text-[var(--app-text-muted)]" />

          <span className="text-[var(--app-text-muted)]">
            {monthLabel}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--app-primary)]">
              Monthly workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--app-text)] sm:text-3xl">
              {monthLabel}
            </h1>

            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              Review income, categories, expenses, bills,
              and monthly totals.
            </p>
          </div>
        </div>
      </header>

      {/*=======================================================
        Summary cards
      =======================================================*/}
      <section className="app-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Planned income"
          value={formatCurrency(
            budgetMonth.plannedIncome
          )}
          helperText={`Expected income for ${monthLabel}`}
          icon={BudgetIcon}
          tone="primary"
        />

        <SummaryCard
          title="Actual income"
          value={formatCurrency(
            budgetMonth.totalIncome
          )}
          helperText="Income recorded in this budget month"
          icon={ArrowDownIcon}
          tone="positive"
        />

        <SummaryCard
          title="Total expenses"
          value={formatCurrency(
            budgetMonth.totalExpenses
          )}
          helperText="Fixed and variable expenses"
          icon={ArrowUpIcon}
          tone="danger"
        />

        <SummaryCard
          title="Left to assign"
          value={formatCurrency(
            budgetMonth.leftToAssign
          )}
          helperText="Planned income not yet assigned"
          icon={WalletIcon}
          tone="warning"
        />
      </section>

      {/*=======================================================
        Bills
      =======================================================*/}
      <BudgetBillsSection
        month={budgetMonth.month}
        year={budgetMonth.year}
        monthLabel={monthLabel}
      />

      {/*=======================================================
        Income records
      =======================================================*/}
      <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
          <div>
            <h2 className="font-semibold text-[var(--app-text)]">
              Income
            </h2>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              Income assigned to {monthLabel}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <ArrowDownIcon className="h-5 w-5" />
          </div>
        </div>

        {sortedIncomeRecords.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--app-text)]">
              No income records
            </p>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              There is no income recorded for this month.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--app-border)]">
            {sortedIncomeRecords.map(
              (income) => (
                <div
                  key={income.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <ArrowDownIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                      {income.source}
                    </p>

                    <p className="truncate text-xs text-[var(--app-text-muted)]">
                      {income.accountName ||
                        'Unknown account'}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        income.amount
                      )}
                    </p>

                    <p className="text-xs text-[var(--app-text-muted)]">
                      {formatDate(
                        income.incomeDate
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/*=======================================================
        Budget categories
      =======================================================*/}
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

        {sortedCategories.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--app-text)]">
              No categories
            </p>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              There are no categories in this budget month.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--app-border)]">
            {sortedCategories.map(
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

      {/*=======================================================
        Expense records
      =======================================================*/}
      <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
          <div>
            <h2 className="font-semibold text-[var(--app-text)]">
              Expenses
            </h2>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              Expense activity recorded in {monthLabel}
            </p>
          </div>

          <div className="rounded-xl bg-red-100 p-2.5 text-red-700 dark:bg-red-500/15 dark:text-red-300">
            <ArrowUpIcon className="h-5 w-5" />
          </div>
        </div>

        {sortedExpenseRecords.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--app-text)]">
              No expenses
            </p>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              There are no expenses recorded for this month.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--app-border)]">
            {sortedExpenseRecords.map(
              (expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                    <ArrowUpIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                      {expense.name}
                    </p>

                    <p className="truncate text-xs text-[var(--app-text-muted)]">
                      {expense.categoryName ||
                        'Unknown category'}
                      {expense.accountName
                        ? ` · ${expense.accountName}`
                        : ''}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(
                        expense.amount
                      )}
                    </p>

                    <p className="text-xs text-[var(--app-text-muted)]">
                      {formatDate(
                        expense.expenseDate
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default BudgetMonthDetailsPage;