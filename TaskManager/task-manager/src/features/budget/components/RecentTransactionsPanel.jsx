import React from 'react';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  TransactionIcon,
} from '../../../components/icons/Icons';

/*===========================================================
  formatCurrency:
  => Formats transaction amounts as US currency.
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
  formatTransactionDate:
  => Converts a backend UTC date into a readable date.

  Example:

  2026-07-29T00:00:00Z
  => Jul 29, 2026
===========================================================*/
const formatTransactionDate = (
  transactionDate
) => {
  if (!transactionDate) {
    return 'Unknown date';
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
    new Date(transactionDate)
  );
};

/*===========================================================
  getTransactionAppearance:
  => Returns the icon, amount prefix, and styles for each
     transaction type.
===========================================================*/
const getTransactionAppearance = (
  transactionType
) => {
  const normalizedType =
    transactionType
      ?.trim()
      .toLowerCase();

  if (normalizedType === 'income') {
    return {
      icon: ArrowDownIcon,

      iconClass:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',

      amountClass:
        'text-emerald-600 dark:text-emerald-400',

      amountPrefix:
        '+',
    };
  }

  if (normalizedType === 'expense') {
    return {
      icon: ArrowUpIcon,

      iconClass:
        'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',

      amountClass:
        'text-red-600 dark:text-red-400',

      amountPrefix:
        '-',
    };
  }

  return {
    icon: TransactionIcon,

    iconClass:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',

    amountClass:
      'text-[var(--app-text)]',

    amountPrefix:
      '',
  };
};

/*===========================================================
  getTransactionSubtitle:
  => Creates readable supporting text for each transaction.

  Income:
  Checking Account

  Expense:
  Groceries · Checking Account

  Transfer:
  Checking Account to Savings Account
===========================================================*/
const getTransactionSubtitle = (
  transaction
) => {
  const normalizedType =
    transaction.type
      ?.trim()
      .toLowerCase();

  if (normalizedType === 'transfer') {
    const fromAccount =
      transaction.fromAccountName ||
      'Unknown account';

    const toAccount =
      transaction.toAccountName ||
      'Unknown account';

    return `${fromAccount} to ${toAccount}`;
  }

  if (normalizedType === 'expense') {
    const parts = [];

    if (transaction.category) {
      parts.push(
        transaction.category
      );
    }

    if (transaction.accountName) {
      parts.push(
        transaction.accountName
      );
    }

    return (
      parts.join(' · ') ||
      'Expense'
    );
  }

  return (
    transaction.accountName ||
    'Income'
  );
};

/*===========================================================
  sortTransactions:
  => Sorts transactions newest first.
  => Uses CreatedAtUtc as a secondary sort value when two
     records share the same transaction date.
===========================================================*/
const sortTransactions = (
  transactions
) => {
  return [...transactions].sort(
    (
      firstTransaction,
      secondTransaction
    ) => {
      const dateDifference =
        new Date(
          secondTransaction.transactionDate
        ) -
        new Date(
          firstTransaction.transactionDate
        );

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return (
        new Date(
          secondTransaction.createdAtUtc
        ) -
        new Date(
          firstTransaction.createdAtUtc
        )
      );
    }
  );
};

/*===========================================================
  RecentTransactionsPanel:
  => Displays recent income, expenses, and transfers.
  => Receives live transaction data from useBudgetDashboard.
===========================================================*/
const RecentTransactionsPanel = ({
  transactions = [],
  maxItems = 6,
}) => {
  const recentTransactions =
    sortTransactions(
      transactions
    ).slice(
      0,
      maxItems
    );

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      <div className="border-b border-[var(--app-border)] px-5 py-4">
        <h2 className="font-semibold text-[var(--app-text)]">
          Recent transactions
        </h2>

        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          Latest income, expenses, and account transfers
        </p>
      </div>

      {recentTransactions.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
            <TransactionIcon className="h-6 w-6 text-[var(--app-text-muted)]" />
          </div>

          <p className="mt-4 text-sm font-semibold text-[var(--app-text)]">
            No transactions found
          </p>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            There are no transactions for the selected month.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {recentTransactions.map(
            (transaction) => {
              const appearance =
                getTransactionAppearance(
                  transaction.type
                );

              const Icon =
                appearance.icon;

              const formattedAmount =
                formatCurrency(
                  transaction.amount
                );

              return (
                <button
                  key={`${transaction.type}-${transaction.id}`}
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--app-surface-muted)]"
                >
                  <div
                    className={`rounded-full p-2.5 ${appearance.iconClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                      {transaction.title}
                    </p>

                    <p className="truncate text-xs text-[var(--app-text-muted)]">
                      {getTransactionSubtitle(
                        transaction
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${appearance.amountClass}`}
                    >
                      {appearance.amountPrefix}
                      {formattedAmount}
                    </p>

                    <p className="text-xs text-[var(--app-text-muted)]">
                      {formatTransactionDate(
                        transaction.transactionDate
                      )}
                    </p>
                  </div>
                </button>
              );
            }
          )}
        </div>
      )}

      <div className="px-5 py-4">
        <button
          type="button"
          className="text-sm font-semibold text-[var(--app-primary)] hover:underline"
        >
          View all transactions
        </button>
      </div>
    </section>
  );
};

export default RecentTransactionsPanel;