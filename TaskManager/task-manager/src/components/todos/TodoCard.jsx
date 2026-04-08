// components/todos/TodoCard.jsx
import React from 'react';
import { formatDate, getDueDateInfo } from '../../utils/helpers';
import { CalendarIcon, CheckIcon, PencilIcon, TrashIcon } from '../icons/Icons';

const TodoCard = ({ todo, onToggleComplete, onEdit, onDelete }) => {

  const dueDate = getDueDateInfo(todo.dueDateUtc);

  return (
    <div
      className={`group flex items-start gap-3 p-4 bg-white rounded-lg border transition-all duration-200 ${todo.isCompleted
        ? 'border-gray-200 bg-gray-50'
        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
        } ${dueDate?.isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(todo)}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 flex-shrink-0 ${todo.isCompleted
          ? 'bg-green-500 border-green-500 text-white'
          : 'border-gray-300 hover:border-indigo-500'
          }`}
      >
        {todo.isCompleted && <CheckIcon className="w-4 h-4" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-semibold truncate ${todo.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}>
            {todo.title}
          </h3>
          {dueDate && (
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${dueDate.isOverdue
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
              }`}>
              <CalendarIcon className="w-3 h-3" />
              {dueDate.display}
            </span>
          )}
        </div>

        {todo.description && (
          <p className={`text-sm mt-1 ${todo.isCompleted ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {todo.description}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-2">
          Created {formatDate(todo.createdAtUtc)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onEdit(todo)}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
          title="Edit"
        >
          <PencilIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title="Delete"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TodoCard;