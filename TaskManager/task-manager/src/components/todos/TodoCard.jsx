import React from 'react';

import { formatDate, getDueDateInfo, getDueStatusText } from '../../utils/helpers';
import {
  CalendarIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
} from '../icons/Icons';

const TodoCard = ({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const dueDate = getDueDateInfo(todo.dueDateUtc);
  const dueStatusText = getDueStatusText(todo.dueDateUtc);

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border p-4 transition-all duration-200 ${todo.isCompleted
        ? 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
        : 'border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-primary)] hover:shadow-md'
        } ${dueDate?.isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(todo)}
        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${todo.isCompleted
          ? 'border-green-500 bg-green-500 text-white'
          : 'border-[var(--app-border)] hover:border-[var(--app-primary)]'
          }`}
      >
        {todo.isCompleted && <CheckIcon className="h-4 w-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`truncate font-semibold ${todo.isCompleted
              ? 'text-[var(--app-text-muted)] line-through'
              : 'text-[var(--app-text)]'
              }`}
          >
            {todo.title}
          </h3>

          {dueDate && (
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${dueDate.isOverdue
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
                  }`}
              >
                <CalendarIcon className="h-3 w-3" />
                {dueDate.display}
              </span>

              <span
                className={`text-xs ${dueDate.isOverdue
                  ? 'text-red-500'
                  : 'text-[var(--app-text-muted)]'
                  }`}
              >
                {dueStatusText}
              </span>
            </div>
          )}
        </div>

        {todo.description && (
          <p
            className={`mt-1 text-sm ${todo.isCompleted
              ? 'text-[var(--app-text-muted)] opacity-70'
              : 'text-[var(--app-text-muted)]'
              }`}
          >
            {todo.description}
          </p>
        )}

        <p className="mt-2 text-xs text-[var(--app-text-muted)] opacity-80">
          Created {formatDate(todo.createdAtUtc)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(todo)}
          className="rounded-lg p-2 text-[var(--app-text-muted)] transition-colors duration-200 hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-primary)]"
          title="Edit"
        >
          <PencilIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(todo.id)}
          className="rounded-lg p-2 text-[var(--app-text-muted)] transition-colors duration-200 hover:bg-red-500/10 hover:text-red-500"
          title="Delete"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default TodoCard;