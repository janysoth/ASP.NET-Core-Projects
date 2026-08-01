import React from 'react';

const budgetGroups = [
  {
    id: 'fixed',
    label: 'Fixed expenses',
    spent: '$2,500',
    planned: '$3,050',
    percentage: 82,
  },
  {
    id: 'variable',
    label: 'Variable expenses',
    spent: '$200',
    planned: '$800',
    percentage: 25,
  },
  {
    id: 'savings',
    label: 'Savings',
    spent: '$500',
    planned: '$500',
    percentage: 100,
  },
];

const BudgetProgressPanel = () => {
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

      <div className="mt-6 space-y-6">
        {budgetGroups.map((group) => (
          <div key={group.id}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-[var(--app-text)]">
                {group.label}
              </p>

              <p className="text-xs text-[var(--app-text-muted)]">
                {group.spent} of {group.planned}
              </p>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--app-primary)]"
                style={{
                  width: `${Math.min(group.percentage, 100)}%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[var(--app-text-muted)]">
                {group.percentage}% used
              </span>

              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                On track
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BudgetProgressPanel;