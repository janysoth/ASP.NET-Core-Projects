import React from 'react';

/*===========================================================
  formatCurrency
===========================================================*/
const formatCurrency = (value) =>
  new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
    }
  ).format(Number(value ?? 0));

/*===========================================================
  formatDate
===========================================================*/
const formatDate = (date) =>
  new Date(date).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

/*===========================================================
  Badge colors
===========================================================*/
const badgeClass = (type) => {
  switch (type) {
    case 'Income':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';

    case 'Expense':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';

    case 'Transfer':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';

    default:
      return 'bg-slate-100 text-slate-700';
  }
};

/*===========================================================
  Amount colors
===========================================================*/
const amountClass = (type) => {
  switch (type) {
    case 'Income':
      return 'text-emerald-600 dark:text-emerald-400';

    case 'Expense':
      return 'text-red-600 dark:text-red-400';

    default:
      return 'text-blue-600 dark:text-blue-400';
  }
};

/*===========================================================
  Amount sign
===========================================================*/
const amountPrefix = (type) => {
  switch (type) {
    case 'Income':
      return '+';

    case 'Expense':
      return '-';

    default:
      return '';
  }
};

/*===========================================================
  BudgetRecentTransactions
===========================================================*/
const BudgetRecentTransactions = ({
  transactions = [],
}) => {
  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">

      <div className="border-b border-[var(--app-border)] px-6 py-4">
        <h2 className="text-lg font-semibold text-[var(--app-text)]">
          Recent Transactions
        </h2>

        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          Latest activity for the selected month
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="p-10 text-center text-[var(--app-text-muted)]">
          No transactions found.
        </div>
      ) : (
        <div>
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4 last:border-b-0"
            >
              <div className="flex flex-col gap-1">

                <div className="flex items-center gap-3">

                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(transaction.type)}`}
                  >
                    {transaction.type}
                  </span>

                  <span className="font-medium text-[var(--app-text)]">
                    {transaction.title}
                  </span>

                </div>

                <div className="text-sm text-[var(--app-text-muted)]">

                  {transaction.category &&
                    `${transaction.category} • `}

                  {transaction.accountName ??
                    transaction.fromAccountName}

                </div>

                <div className="text-xs text-[var(--app-text-muted)]">
                  {formatDate(
                    transaction.transactionDate
                  )}
                </div>

              </div>

              <div
                className={`text-lg font-bold ${amountClass(transaction.type)}`}
              >
                {amountPrefix(transaction.type)}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default BudgetRecentTransactions;