import React from 'react';

import {
  ChevronRightIcon,
  WalletIcon,
} from '../../../components/icons/Icons';

const accounts = [
  {
    id: 'checking',
    name: 'Checking Account',
    type: 'Checking',
    balance: '$3,500.00',
    initials: 'CH',
  },
  {
    id: 'savings',
    name: 'Savings Account',
    type: 'Savings',
    balance: '$8,000.00',
    initials: 'SA',
  },
  {
    id: 'credit-card',
    name: 'Credit Card',
    type: 'Credit Card',
    balance: '$1,200.00',
    initials: 'CC',
  },
];

const AccountsPanel = () => {
  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
        <div>
          <h2 className="font-semibold text-[var(--app-text)]">
            Financial accounts
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Current balances across your accounts
          </p>
        </div>

        <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <WalletIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="divide-y divide-[var(--app-border)]">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--app-surface-muted)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              {account.initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                {account.name}
              </p>

              <p className="text-xs text-[var(--app-text-muted)]">
                {account.type}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--app-text)]">
                {account.balance}
              </p>
            </div>

            <ChevronRightIcon className="h-4 w-4 text-[var(--app-text-muted)]" />
          </button>
        ))}
      </div>

      <div className="px-5 py-4">
        <button
          type="button"
          className="text-sm font-semibold text-[var(--app-primary)] hover:underline"
        >
          View all accounts
        </button>
      </div>
    </section>
  );
};

export default AccountsPanel;