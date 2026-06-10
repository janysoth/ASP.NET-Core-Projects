import React from 'react';

import { CheckIcon } from '../icons/Icons';
import TodoCard from './TodoCard';

const TodoList = ({
  todos,
  filter,
  isLoading,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <svg
          className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--app-primary)]"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />

          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>

        <p className="text-[var(--app-text-muted)]">
          Loading todos...
        </p>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
          <CheckIcon className="h-8 w-8 text-[var(--app-primary)]" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-[var(--app-text)]">
          {filter === 'all'
            ? 'No todos yet'
            : filter === 'active'
              ? 'No active todos'
              : 'No completed todos'}
        </h3>

        <p className="text-[var(--app-text-muted)]">
          {filter === 'all'
            ? 'Add your first todo above to get started!'
            : 'Try switching to a different filter.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 app-section-gap">
      {todos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TodoList;