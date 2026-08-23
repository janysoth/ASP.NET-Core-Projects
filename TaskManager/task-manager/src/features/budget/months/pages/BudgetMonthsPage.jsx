import React, {
  useEffect,
  useState,
} from 'react';

import {
  getBudgetMonths,
} from '@/features/budget/api/budgetApi';

import {
  BudgetMonthCard,
  BudgetMonthEmptyState,
  BudgetMonthsHeader,
} from '@/features/budget/months/components';

import {
  BudgetMonthFormModal,
} from '@/features/budget/months/forms';

import {
  useBudgetMonthForm,
} from '@/features/budget/months/hooks';

/*===========================================================
  getErrorMessage:
  => Extracts a readable backend error message.
===========================================================*/
const getErrorMessage = (
  error
) => {
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
  months = []
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

  Supports:
  => Loading budget months.
  => Empty state.
  => Create budget month.
  => Navigation to monthly details.

  Next:
  => Edit budget month.
  => Delete budget month.
===========================================================*/
const BudgetMonthsPage = () => {
  /*===========================================================
    Budget Month Data
  ===========================================================*/
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
    => Loads all Budget Months.
    => Sorts newest first.
  ===========================================================*/
  const loadBudgetMonths =
    async () => {
      try {
        setLoading(
          true
        );

        setError('');

        const months =
          await getBudgetMonths();

        const normalizedMonths =
          Array.isArray(
            months
          )
            ? months
            : [];

        setBudgetMonths(
          sortBudgetMonths(
            normalizedMonths
          )
        );
      } catch (
      requestError
      ) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /*===========================================================
    Budget Month Form
  ===========================================================*/
  const {
    isBudgetMonthFormOpen,
    selectedBudgetMonth,
    budgetMonthFormMode,
    submittingBudgetMonth,

    handleOpenCreateBudgetMonth,
    handleCloseBudgetMonthForm,
    handleBudgetMonthSubmit,
  } = useBudgetMonthForm({
    onBudgetMonthsChanged:
      loadBudgetMonths,
  });

  /*===========================================================
    Initial Load
  ===========================================================*/
  useEffect(() => {
    loadBudgetMonths();
  }, []);

  return (
    <div className="app-page-padding px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/*=======================================================
        Page Header
      =======================================================*/}
      <BudgetMonthsHeader
        onCreateBudgetMonth={
          handleOpenCreateBudgetMonth
        }
      />

      {/*=======================================================
        Loading State
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
        Error State
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
              onClick={
                loadBudgetMonths
              }
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

      {/*=======================================================
        Empty State
      =======================================================*/}
      {!loading &&
        !error &&
        budgetMonths.length ===
        0 && (
          <BudgetMonthEmptyState
            onCreateBudgetMonth={
              handleOpenCreateBudgetMonth
            }
          />
        )}

      {/*=======================================================
        Budget Month Cards
      =======================================================*/}
      {!loading &&
        !error &&
        budgetMonths.length >
        0 && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {budgetMonths.map(
              (
                budgetMonth
              ) => (
                <BudgetMonthCard
                  key={
                    budgetMonth.id
                  }
                  budgetMonth={
                    budgetMonth
                  }
                />
              )
            )}
          </section>
        )}

      {/*=======================================================
        Budget Month Form Modal
      =======================================================*/}
      <BudgetMonthFormModal
        mode={
          budgetMonthFormMode
        }
        budgetMonth={
          selectedBudgetMonth
        }
        isOpen={
          isBudgetMonthFormOpen
        }
        onClose={
          handleCloseBudgetMonthForm
        }
        onSubmit={
          handleBudgetMonthSubmit
        }
        existingBudgetMonths={
          budgetMonths
        }
        submitting={
          submittingBudgetMonth
        }
      />
    </div>
  );
};

export default BudgetMonthsPage;