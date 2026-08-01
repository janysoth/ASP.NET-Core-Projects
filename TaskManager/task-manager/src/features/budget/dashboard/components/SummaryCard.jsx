import React from 'react';

const toneClasses = {
  primary: {
    icon: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    value: 'text-[var(--app-text)]',
  },
  positive: {
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    value: 'text-[var(--app-text)]',
  },
  danger: {
    icon: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    value: 'text-[var(--app-text)]',
  },
};

const SummaryCard = ({
  title,
  value,
  helperText,
  icon: Icon,
  tone = 'primary',
}) => {
  const selectedTone =
    toneClasses[tone] ?? toneClasses.primary;

  return (
    <article className="app-card-padding rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--app-text-muted)]">
            {title}
          </p>

          <p className={`mt-2 text-2xl font-bold tracking-tight ${selectedTone.value}`}>
            {value}
          </p>
        </div>

        {Icon && (
          <div className={`rounded-xl p-3 ${selectedTone.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-[var(--app-text-muted)]">
        {helperText}
      </p>
    </article>
  );
};

export default SummaryCard;