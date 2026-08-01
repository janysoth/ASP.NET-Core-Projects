import React from 'react';

import {
  CalendarIcon,
  ChevronRightIcon,
} from '../../../../components/icons/Icons';

/*===========================================================
  formatCurrency:
  => Formats bill amounts as US currency.
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
  formatDueDate:
  => Converts the backend UTC date into a readable date.

  Example:

  2026-08-15T00:00:00Z
  => Aug 15
===========================================================*/
const formatDueDate = (dueDate) => {
  if (!dueDate) {
    return 'No due date';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }
  ).format(
    new Date(dueDate)
  );
};

/*===========================================================
  getBillStatusAppearance:
  => Returns the styles used for each bill status.
===========================================================*/
const getBillStatusAppearance = (bill) => {
  if (bill.isPaid) {
    return {
      label: 'Paid',
      textClass:
        'text-emerald-600 dark:text-emerald-400',
      iconClass:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    };
  }

  const normalizedStatus =
    bill.status?.trim().toLowerCase();

  if (normalizedStatus === 'overdue') {
    return {
      label: 'Overdue',
      textClass:
        'text-red-600 dark:text-red-400',
      iconClass:
        'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    };
  }

  if (
    normalizedStatus === 'due today' ||
    normalizedStatus === 'due soon'
  ) {
    return {
      label: bill.status,
      textClass:
        'text-amber-600 dark:text-amber-400',
      iconClass:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    };
  }

  return {
    label: bill.status || 'Upcoming',
    textClass:
      'text-[var(--app-text-muted)]',
    iconClass:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  };
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
  UpcomingBillsPanel:
  => Displays bills for the selected budget month.
  => Receives live bill data from useBudgetDashboard.
===========================================================*/
const UpcomingBillsPanel = ({
  bills = [],
}) => {
  const sortedBills =
    sortBills(bills);

  const unpaidBills =
    bills.filter(
      (bill) => !bill.isPaid
    );

  const paidBills =
    bills.filter(
      (bill) => bill.isPaid
    );

  const totalRemaining =
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

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
        <div>
          <h2 className="font-semibold text-[var(--app-text)]">
            Upcoming bills
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Bills due during the selected month
          </p>
        </div>

        <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <CalendarIcon className="h-5 w-5" />
        </div>
      </div>

      {sortedBills.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
            <CalendarIcon className="h-6 w-6 text-[var(--app-text-muted)]" />
          </div>

          <p className="mt-4 text-sm font-semibold text-[var(--app-text)]">
            No bills found
          </p>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            There are no bills for the selected month.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-[var(--app-border)]">
            {sortedBills.map((bill) => {
              const appearance =
                getBillStatusAppearance(
                  bill
                );

              return (
                <button
                  key={bill.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--app-surface-muted)]"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${appearance.iconClass}`}>
                    <CalendarIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                      {bill.name}
                    </p>

                    <p className="truncate text-xs text-[var(--app-text-muted)]">
                      {bill.budgetCategoryName
                        ? `${bill.budgetCategoryName} · `
                        : ''}
                      Due {formatDueDate(
                        bill.dueDate
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--app-text)]">
                      {formatCurrency(
                        bill.expectedAmount
                      )}
                    </p>

                    <p className={`text-xs font-medium ${appearance.textClass}`}>
                      {appearance.label}
                    </p>
                  </div>

                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--app-text-muted)]" />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/50">
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Unpaid
              </p>

              <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                {unpaidBills.length}
              </p>
            </div>

            <div className="border-x border-[var(--app-border)] px-4 py-3 text-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Paid
              </p>

              <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {paidBills.length}
              </p>
            </div>

            <div className="px-4 py-3 text-center">
              <p className="text-xs text-[var(--app-text-muted)]">
                Remaining
              </p>

              <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                {formatCurrency(
                  totalRemaining
                )}
              </p>
            </div>
          </div>
        </>
      )}

      <div className="px-5 py-4">
        <button
          type="button"
          className="text-sm font-semibold text-[var(--app-primary)] hover:underline"
        >
          View all bills
        </button>
      </div>
    </section>
  );
};

export default UpcomingBillsPanel;