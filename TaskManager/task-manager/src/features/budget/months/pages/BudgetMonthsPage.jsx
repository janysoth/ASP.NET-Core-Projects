import React, {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  BudgetIcon,
  ChevronRightIcon,
  PlusIcon,
} from '../../../../components/icons/Icons';

import {
  getBudgetMonths,
} from '../../dashboard/api/budgetDashboardApi';

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
  getErrorMessage:
  => Extracts a readable backend error message.
===========================================================*/
const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Unable to load budget months.'
  );
};

/*===========================================================
  sortBudgetMonths:
  => Sorts budget months newest first.
===========================================================*/
const sortBudgetMonths = (
  months
) => {
  return [...months].sort(
    (
      firstMonth,
      secondMonth
    ) => {
      if (
        firstMonth.year !==
        secondMonth.year
      ) {
        return (
          secondMonth.year -
          firstMonth.year
        );
      }

      return (
        secondMonth.month -
        firstMonth.month
      );
    }
  );
};

/*===========================================================
  BudgetMonthsPage:
  => Displays every budget month owned by the logged-in user.
  => Each month card links to its monthly details page.
  => Create, edit, and delete actions will be added later.
===========================================================*/
const BudgetMonthsPage = () => {
  const [
    budgetMonths,
    setBudgetMonths,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /*===========================================================
    loadBudgetMonths:
    => Loads all budget months from the backend.
  ===========================================================*/
  const loadBudgetMonths =
    async () => {
      try {
        setLoading(true);
        setError('');

        const months =
          await getBudgetMonths();

        setBudgetMonths(
          sortBudgetMonths(
            months
          )
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

  /*===========================================================
    Initial load
  ===========================================================*/
  useEffect(() => {
    loadBudgetMonths();
  }, []);

  return (
    <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/*=======================================================
        Page header
      =======================================================*/}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--app-primary)]">
            Budget planning
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--app-text)] sm:text-3xl">
            Budget Months
          </h1>

          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Review and manage your monthly budget plans.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--app-primary-hover)]"
        >
          <PlusIcon className="h-5 w-5" />

          Create budget month
        </button>
      </header>

      {/*=======================================================
        Loading state
      =======================================================*/}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--app-border)] border-t-[var(--app-primary)]" />

            <p className="mt-4 text-sm font-medium text-[var(--app-text-muted)]">
              Loading budget months...
            </p>
          </div>
        </div>
      )}

      {/*=======================================================
        Error state
      =======================================================*/}
      {!loading &&
        error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10">
            <h2 className="font-semibold text-red-700 dark:text-red-300">
              Unable to load budget months
            </h2>

            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={loadBudgetMonths}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

      {/*=======================================================
        Empty state
      =======================================================*/}
      {!loading &&
        !error &&
        budgetMonths.length === 0 && (
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              <BudgetIcon className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[var(--app-text)]">
              No budget months found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-text-muted)]">
              Create your first budget month to begin planning
              income, expenses, savings, and bills.
            </p>
          </div>
        )}

      {/*=======================================================
        Budget month cards
      =======================================================*/}
      {!loading &&
        !error &&
        budgetMonths.length > 0 && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {budgetMonths.map(
              (budgetMonth) => (
                <Link
                  key={
                    budgetMonth.id
                  }
                  to={`/budget/months/${budgetMonth.id}`}
                  className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--app-primary)] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--app-primary)]">
                        Budget month
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-[var(--app-text)]">
                        {formatBudgetMonth(
                          budgetMonth.month,
                          budgetMonth.year
                        )}
                      </h2>
                    </div>

                    <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <BudgetIcon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--app-text-muted)]">
                        Planned income
                      </p>

                      <p className="mt-1 text-base font-bold text-[var(--app-text)]">
                        {formatCurrency(
                          budgetMonth.plannedIncome
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--app-text-muted)]">
                        Actual income
                      </p>

                      <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(
                          budgetMonth.totalIncome
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--app-text-muted)]">
                        Expenses
                      </p>

                      <p className="mt-1 text-base font-bold text-[var(--app-text)]">
                        {formatCurrency(
                          budgetMonth.totalExpenses
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--app-text-muted)]">
                        Left to assign
                      </p>

                      <p className="mt-1 text-base font-bold text-[var(--app-text)]">
                        {formatCurrency(
                          budgetMonth.leftToAssign
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[var(--app-border)] pt-4">
                    <span className="text-sm font-semibold text-[var(--app-primary)]">
                      View budget
                    </span>

                    <ChevronRightIcon className="h-5 w-5 text-[var(--app-text-muted)]" />
                  </div>
                </Link>
              )
            )}
          </section>
        )}
    </div>
  );
};

export default BudgetMonthsPage;