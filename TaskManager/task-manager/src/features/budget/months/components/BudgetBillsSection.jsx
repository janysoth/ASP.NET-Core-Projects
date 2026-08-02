import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarIcon,
  ReceiptIcon,
} from '../../../../components/icons/Icons';

import {
  getBills,
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
  formatDate:
  => Formats a bill date without changing the calendar day.
===========================================================*/
const formatDate = (value) => {
  if (!value) {
    return 'No due date';
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
  => Extracts a readable API error message.
===========================================================*/
const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Unable to load bills.'
  );
};

/*===========================================================
  sortBills:
  => Shows unpaid bills first.
  => Sorts each group by due date.
===========================================================*/
const sortBills = (bills) => {
  return [...bills].sort(
    (firstBill, secondBill) => {
      if (
        firstBill.isPaid !==
        secondBill.isPaid
      ) {
        return firstBill.isPaid
          ? 1
          : -1;
      }

      return (
        new Date(firstBill.dueDate) -
        new Date(secondBill.dueDate)
      );
    }
  );
};

/*===========================================================
  getStatusAppearance:
  => Provides readable status text and matching styles.
===========================================================*/
const getStatusAppearance = (bill) => {
  if (bill.isPaid) {
    return {
      label: 'Paid',
      className:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    };
  }

  const normalizedStatus =
    bill.status
      ?.trim()
      .toLowerCase();

  if (normalizedStatus === 'overdue') {
    return {
      label: 'Overdue',
      className:
        'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    };
  }

  if (
    normalizedStatus === 'partially paid' ||
    normalizedStatus === 'partial'
  ) {
    return {
      label: 'Partially Paid',
      className:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    };
  }

  return {
    label: bill.status || 'Upcoming',
    className:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  };
};

/*===========================================================
  BudgetBillsSection:
  => Loads and displays bills for one budget month.
  => This first version is read-only.
===========================================================*/
const BudgetBillsSection = ({
  month,
  year,
  monthLabel,
}) => {
  const [
    bills,
    setBills,
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
    loadBills:
    => Loads bills using the selected month and year.
  ===========================================================*/
  const loadBills = useCallback(async () => {
    if (!month || !year) {
      setBills([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response =
        await getBills(
          month,
          year
        );

      setBills(
        sortBills(response)
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
  }, [month, year]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const summary =
    useMemo(() => {
      const paidBills =
        bills.filter(
          (bill) => bill.isPaid
        );

      const unpaidBills =
        bills.filter(
          (bill) => !bill.isPaid
        );

      const expectedTotal =
        bills.reduce(
          (total, bill) =>
            total +
            Number(
              bill.expectedAmount ?? 0
            ),
          0
        );

      const remainingTotal =
        unpaidBills.reduce(
          (total, bill) =>
            total +
            Number(
              bill.remainingAmount ??
              bill.expectedAmount ??
              0
            ),
          0
        );

      return {
        totalBills:
          bills.length,

        paidBills:
          paidBills.length,

        unpaidBills:
          unpaidBills.length,

        expectedTotal,

        remainingTotal,
      };
    }, [
      bills,
    ]);

  return (
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Header
      =======================================================*/}
      <div className="flex flex-col gap-4 border-b border-[var(--app-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-[var(--app-text)]">
            Bills
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Fixed expense obligations for {monthLabel}
          </p>
        </div>

        <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <ReceiptIcon className="h-5 w-5" />
        </div>
      </div>

      {/*=======================================================
        Loading state
      =======================================================*/}
      {loading && (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[var(--app-border)] border-t-[var(--app-primary)]" />

            <p className="mt-3 text-sm text-[var(--app-text-muted)]">
              Loading bills...
            </p>
          </div>
        </div>
      )}

      {/*=======================================================
        Error state
      =======================================================*/}
      {!loading &&
        error && (
          <div className="p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Unable to load bills
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>

              <button
                type="button"
                onClick={loadBills}
                className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        )}

      {/*=======================================================
        Empty state
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length === 0 && (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
              <ReceiptIcon className="h-6 w-6 text-[var(--app-text-muted)]" />
            </div>

            <p className="mt-4 text-sm font-semibold text-[var(--app-text)]">
              No bills found
            </p>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              There are no bills in this budget month.
            </p>
          </div>
        )}

      {/*=======================================================
        Bill rows
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length > 0 && (
          <>
            <div className="divide-y divide-[var(--app-border)]">
              {bills.map((bill) => {
                const statusAppearance =
                  getStatusAppearance(
                    bill
                  );

                return (
                  <button
                    key={bill.id}
                    type="button"
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--app-surface-muted)]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <CalendarIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                          {bill.name}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusAppearance.className}`}
                        >
                          {statusAppearance.label}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
                        {bill.budgetCategoryName ||
                          'Unknown category'}
                        {' · '}
                        Due {formatDate(
                          bill.dueDate
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-[var(--app-text)]">
                        {formatCurrency(
                          bill.expectedAmount
                        )}
                      </p>

                      {!bill.isPaid && (
                        <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                          {formatCurrency(
                            bill.remainingAmount ??
                            bill.expectedAmount
                          )}{' '}
                          remaining
                        </p>
                      )}

                      {bill.isPaid && (
                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                          Paid{' '}
                          {bill.paidDate
                            ? formatDate(
                              bill.paidDate
                            )
                            : ''}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/*=================================================
              Bill summary
            =================================================*/}
            <div className="grid grid-cols-2 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 sm:grid-cols-5">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Total
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {summary.totalBills}
                </p>
              </div>

              <div className="border-l border-[var(--app-border)] px-4 py-3 text-center">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Paid
                </p>

                <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.paidBills}
                </p>
              </div>

              <div className="border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-l sm:border-t-0">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Unpaid
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {summary.unpaidBills}
                </p>
              </div>

              <div className="border-l border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-t-0">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Expected
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {formatCurrency(
                    summary.expectedTotal
                  )}
                </p>
              </div>

              <div className="col-span-2 border-t border-[var(--app-border)] px-4 py-3 text-center sm:col-span-1 sm:border-l sm:border-t-0">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Remaining
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {formatCurrency(
                    summary.remainingTotal
                  )}
                </p>
              </div>
            </div>
          </>
        )}
    </section>
  );
};

export default BudgetBillsSection;