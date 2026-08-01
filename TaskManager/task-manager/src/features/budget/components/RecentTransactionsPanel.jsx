import React from 'react';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  TransactionIcon,
} from '../../../components/icons/Icons';

const transactions = [
  {
    id: 'income-1',
    title: 'Paycheck',
    subtitle: 'Checking Account',
    amount: '+$3,600.00',
    date: 'Aug 7',
    type: 'Income',
  },
  {
    id: 'expense-1',
    title: 'Mortgage',
    subtitle: 'Housing',
    amount: '-$1,600.00',
    date: 'Jul 28',
    type: 'Expense',
  },
  {
    id: 'transfer-1',
    title: 'Account Transfer',
    subtitle: 'Checking to Savings',
    amount: '$500.00',
    date: 'Jul 29',
    type: 'Transfer',
  },
  {
    id: 'expense-2',
    title: 'Car Payment',
    subtitle: 'Auto Payment',
    amount: '-$900.00',
    date: 'Jul 29',
    type: 'Expense',
  },
];

const getTransactionAppearance = (type) => {
  if (type === 'Income') {
    return {
      icon: ArrowDownIcon,
      iconClass:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      amountClass:
        'text-emerald-600 dark:text-emerald-400',
    };
  }

  if (type === 'Expense') {
    return {
      icon: ArrowUpIcon,
      iconClass:
        'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
      amountClass:
        'text-red-600 dark:text-red-400',
    };
  }

  return {
    icon: TransactionIcon,
    iconClass:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    amountClass:
      'text-[var(--app-text)]',
  };
};

const RecentTransactionsPanel = () => {
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

      <div className="divide-y divide-[var(--app-border)]">
        {transactions.map((transaction) => {
          const appearance =
            getTransactionAppearance(transaction.type);

          const Icon =
            appearance.icon;

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-3 px-5 py-4"
            >
              <div className={`rounded-full p-2.5 ${appearance.iconClass}`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                  {transaction.title}
                </p>

                <p className="truncate text-xs text-[var(--app-text-muted)]">
                  {transaction.subtitle}
                </p>
              </div>

              <div className="text-right">
                <p className={`text-sm font-semibold ${appearance.amountClass}`}>
                  {transaction.amount}
                </p>

                <p className="text-xs text-[var(--app-text-muted)]">
                  {transaction.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>

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