import React from 'react';

import {
  CalendarIcon,
  ChevronRightIcon,
} from '../../../components/icons/Icons';

const bills = [
  {
    id: 'mortgage',
    name: 'Mortgage',
    dueText: 'Due Aug 1',
    amount: '$1,600.00',
    status: 'Due soon',
  },
  {
    id: 'car',
    name: 'Car Payment',
    dueText: 'Due Aug 10',
    amount: '$910.00',
    status: 'Upcoming',
  },
  {
    id: 'phone',
    name: 'Phone Bill',
    dueText: 'Due Aug 15',
    amount: '$450.00',
    status: 'Upcoming',
  },
  {
    id: 'water',
    name: 'Water Bill',
    dueText: 'Due Aug 18',
    amount: '$90.00',
    status: 'Upcoming',
  },
];

const UpcomingBillsPanel = () => {
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

      <div className="divide-y divide-[var(--app-border)]">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center gap-3 px-5 py-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
              <CalendarIcon className="h-5 w-5 text-[var(--app-primary)]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                {bill.name}
              </p>

              <p className="text-xs text-[var(--app-text-muted)]">
                {bill.dueText}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--app-text)]">
                {bill.amount}
              </p>

              <p className="text-xs text-amber-600 dark:text-amber-400">
                {bill.status}
              </p>
            </div>

            <ChevronRightIcon className="h-4 w-4 text-[var(--app-text-muted)]" />
          </div>
        ))}
      </div>

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