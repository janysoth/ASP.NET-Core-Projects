import React from 'react';

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
  calculatePercentage:
  => Calculates actual progress against a planned amount.
  => Returns 0 when no amount was planned.
===========================================================*/
const calculatePercentage = (
  actualAmount,
  plannedAmount
) => {
  const actual =
    Number(actualAmount ?? 0);

  const planned =
    Number(plannedAmount ?? 0);

  if (planned <= 0) {
    return 0;
  }

  return Math.round(
    (actual / planned) * 100
  );
};

/*===========================================================
  clampProgressWidth:
  => Keeps the visual progress bar between 0% and 100%.
  => The displayed percentage can still exceed 100% when
     the category is over budget.
===========================================================*/
const clampProgressWidth = (
  percentage
) => {
  return Math.min(
    Math.max(
      percentage,
      0
    ),
    100
  );
};

/*===========================================================
  getSavingsActualAmount:
  => Adds the spent amounts reported by each savings
     comparison returned by the dashboard API.
===========================================================*/
const getSavingsActualAmount = (
  savingsComparisons = []
) => {
  return savingsComparisons.reduce(
    (total, comparison) =>
      total +
      Number(
        comparison.spentAmount ?? 0
      ),
    0
  );
};

/*===========================================================
  getProgressAppearance:
  => Returns progress colors and status text.

  Rules:

  Over 100%:
  => Over budget

  Exactly 100%:
  => Fully used

  75% through 99%:
  => Near limit

  Below 75%:
  => On track

  No planned amount:
  => Not planned
===========================================================*/
const getProgressAppearance = ({
  plannedAmount,
  actualAmount,
  percentage,
  type,
}) => {
  const planned =
    Number(plannedAmount ?? 0);

  const actual =
    Number(actualAmount ?? 0);

  if (planned <= 0) {
    return {
      barClass:
        'bg-slate-400 dark:bg-slate-500',

      statusClass:
        'text-[var(--app-text-muted)]',

      status:
        'Not planned',
    };
  }

  if (
    actual > planned ||
    percentage > 100
  ) {
    return {
      barClass:
        'bg-red-500',

      statusClass:
        'text-red-600 dark:text-red-400',

      status:
        type === 'Savings'
          ? 'Above goal'
          : 'Over budget',
    };
  }

  if (percentage === 100) {
    return {
      barClass:
        type === 'Savings'
          ? 'bg-emerald-500'
          : 'bg-indigo-500',

      statusClass:
        'text-emerald-600 dark:text-emerald-400',

      status:
        type === 'Savings'
          ? 'Goal reached'
          : 'Fully used',
    };
  }

  if (percentage >= 75) {
    return {
      barClass:
        'bg-amber-500',

      statusClass:
        'text-amber-600 dark:text-amber-400',

      status:
        type === 'Savings'
          ? 'Nearly there'
          : 'Near limit',
    };
  }

  return {
    barClass:
      type === 'Savings'
        ? 'bg-emerald-500'
        : 'bg-[var(--app-primary)]',

    statusClass:
      'text-emerald-600 dark:text-emerald-400',

    status:
      'On track',
  };
};

/*===========================================================
  ProgressItem:
  => Displays one live budget progress row.
===========================================================*/
const ProgressItem = ({
  label,
  type,
  actualAmount,
  plannedAmount,
  remainingAmount,
}) => {
  const percentage =
    calculatePercentage(
      actualAmount,
      plannedAmount
    );

  const progressWidth =
    clampProgressWidth(
      percentage
    );

  const appearance =
    getProgressAppearance({
      plannedAmount,
      actualAmount,
      percentage,
      type,
    });

  const hasPlan =
    Number(plannedAmount ?? 0) > 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--app-text)]">
            {label}
          </p>

          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
            {formatCurrency(
              actualAmount
            )}{' '}
            of{' '}
            {formatCurrency(
              plannedAmount
            )}
          </p>
        </div>

        <span
          className={`shrink-0 text-xs font-semibold ${appearance.statusClass}`}
        >
          {appearance.status}
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${appearance.barClass}`}
          style={{
            width: `${progressWidth}%`,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <span className="text-xs text-[var(--app-text-muted)]">
          {hasPlan
            ? `${percentage}% used`
            : 'No amount planned'}
        </span>

        <span className="text-xs font-medium text-[var(--app-text-muted)]">
          {type === 'Savings'
            ? `${formatCurrency(
              Math.max(
                Number(plannedAmount ?? 0) -
                Number(actualAmount ?? 0),
                0
              )
            )} remaining`
            : `${formatCurrency(
              remainingAmount
            )} remaining`}
        </span>
      </div>
    </div>
  );
};

/*===========================================================
  BudgetProgressPanel:
  => Displays live fixed expense, variable expense, and
     savings progress from DashboardSummaryResponse.
===========================================================*/
const BudgetProgressPanel = ({
  dashboardSummary,
}) => {
  const spending =
    dashboardSummary?.spending;

  const savings =
    dashboardSummary?.savings;

  const plannedFixedExpenses =
    Number(
      spending?.plannedFixedExpenses ?? 0
    );

  const actualFixedExpenses =
    Number(
      spending?.actualFixedExpenses ?? 0
    );

  const remainingFixedExpenseBudget =
    Number(
      spending?.remainingFixedExpenseBudget ?? 0
    );

  const plannedVariableExpenses =
    Number(
      spending?.plannedVariableExpenses ?? 0
    );

  const actualVariableExpenses =
    Number(
      spending?.actualVariableExpenses ?? 0
    );

  const remainingVariableExpenseBudget =
    Number(
      spending?.remainingVariableExpenseBudget ?? 0
    );

  const plannedSavings =
    Number(
      savings?.plannedSavings ?? 0
    );

  const actualSavings =
    getSavingsActualAmount(
      savings?.savingsComparisons ?? []
    );

  const totalPlanned =
    plannedFixedExpenses +
    plannedVariableExpenses +
    plannedSavings;

  const totalActual =
    actualFixedExpenses +
    actualVariableExpenses +
    actualSavings;

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
      <div>
        <h2 className="font-semibold text-[var(--app-text)]">
          Budget progress
        </h2>

        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          Planned amounts compared with current activity
        </p>
      </div>

      <div className="mt-6 space-y-7">
        <ProgressItem
          label="Fixed expenses"
          type="Expense"
          actualAmount={
            actualFixedExpenses
          }
          plannedAmount={
            plannedFixedExpenses
          }
          remainingAmount={
            remainingFixedExpenseBudget
          }
        />

        <ProgressItem
          label="Variable expenses"
          type="Expense"
          actualAmount={
            actualVariableExpenses
          }
          plannedAmount={
            plannedVariableExpenses
          }
          remainingAmount={
            remainingVariableExpenseBudget
          }
        />

        <ProgressItem
          label="Savings"
          type="Savings"
          actualAmount={
            actualSavings
          }
          plannedAmount={
            plannedSavings
          }
          remainingAmount={
            Math.max(
              plannedSavings -
              actualSavings,
              0
            )
          }
        />
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-[var(--app-border)] pt-5">
        <div>
          <p className="text-xs text-[var(--app-text-muted)]">
            Total planned
          </p>

          <p className="mt-1 text-lg font-bold text-[var(--app-text)]">
            {formatCurrency(
              totalPlanned
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-[var(--app-text-muted)]">
            Total activity
          </p>

          <p className="mt-1 text-lg font-bold text-[var(--app-text)]">
            {formatCurrency(
              totalActual
            )}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BudgetProgressPanel;