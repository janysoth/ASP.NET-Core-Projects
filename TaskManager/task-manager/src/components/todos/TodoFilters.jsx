import React from 'react';

import { FILTER_OPTIONS } from '../../utils/constants';

const TodoFilters = ({
  filter,
  setFilter,
  stats,
}) => {
  const filters = [
    {
      key: FILTER_OPTIONS.ALL,
      label: 'All',
      count: stats.total,
    },
    {
      key: FILTER_OPTIONS.ACTIVE,
      label: 'Active',
      count: stats.active,
    },
    {
      key: FILTER_OPTIONS.COMPLETED,
      label: 'Completed',
      count: stats.completed,
    },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2 app-section-spacing">
      {filters.map((item) => {
        const active = filter === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 ${active
                ? 'bg-[var(--app-primary)] text-white shadow-md'
                : 'border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
              }`}
          >
            {item.label}

            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active
                  ? 'bg-[var(--app-primary-hover)] text-white'
                  : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TodoFilters;