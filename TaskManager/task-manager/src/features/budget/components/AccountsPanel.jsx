import React from 'react';

import {
  ChevronRightIcon,
  WalletIcon,
} from '../../../components/icons/Icons';

/*===========================================================
  formatCurrency:
  => Formats account balances as US currency.
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
  getAccountInitials:
  => Creates short initials for the account circle.

  Examples:

  Checking Account -> CA
  Savings Account  -> SA
  Credit Card      -> CC
===========================================================*/
const getAccountInitials = (name) => {
  if (!name) {
    return 'AC';
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join('');
};

/*===========================================================
  formatAccountType:
  => Converts backend account types into readable labels.

  CreditCard -> Credit Card
===========================================================*/
const formatAccountType = (type) => {
  if (type === 'CreditCard') {
    return 'Credit Card';
  }

  return type || 'Account';
};

/*===========================================================
  AccountsPanel:
  => Displays live financial account balances.
===========================================================*/
const AccountsPanel = ({
  accounts = [],
}) => {
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

      {accounts.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-[var(--app-text)]">
            No accounts found
          </p>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Create an account to begin tracking balances.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--app-surface-muted)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                {getAccountInitials(
                  account.name
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                  {account.name}
                </p>

                <p className="text-xs text-[var(--app-text-muted)]">
                  {formatAccountType(
                    account.type
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--app-text)]">
                  {formatCurrency(
                    account.currentBalance
                  )}
                </p>
              </div>

              <ChevronRightIcon className="h-4 w-4 text-[var(--app-text-muted)]" />
            </button>
          ))}
        </div>
      )}

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