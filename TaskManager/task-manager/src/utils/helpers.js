// Constants
// export const FILTER_OPTIONS = {
//   ALL: 'all',
//   ACTIVE: 'active',
//   COMPLETED: 'completed'
// };

import { FILTER_OPTIONS } from "./constants";

// =========================
// UNIVERSAL DATE HELPERS
// =========================
export const formatDate = (
  utcIsoString,
  options = { month: '2-digit', day: '2-digit', year: 'numeric' }
) => {
  if (!utcIsoString) return '';

  const date = new Date(utcIsoString);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', options);
};

export const getDueDateInfo = (utcIsoString, isCompleted = false) => {
  if (!utcIsoString) return null;

  const date = new Date(utcIsoString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const localDate = new Date(
    date.getTime() + date.getTimezoneOffset() * 60 * 1000
  );

  const isOverdue = localDate < today && !isCompleted;

  return {
    display: formatDate(localDate.toISOString(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    isOverdue,
  };
};

// Existing helpers
export const utcToLocalDateString = (utcIsoString) => {
  if (!utcIsoString) return '';
  return utcIsoString.split('T')[0];
};

export const localDateToUtcString = (localDateString) => {
  if (!localDateString) return null;
  return `${localDateString}T00:00:00.000Z`;
};

// Stats Helper
export const calculateStats = (todos) => ({
  total: todos.length,
  active: todos.filter(t => !t.isCompleted).length,
  completed: todos.filter(t => t.isCompleted).length
});

// Filter Helper
export const filterTodos = (todos, filter) => {
  switch (filter) {
    case FILTER_OPTIONS.ACTIVE:
      return todos.filter(todo => !todo.isCompleted);
    case FILTER_OPTIONS.COMPLETED:
      return todos.filter(todo => todo.isCompleted);
    default:
      return todos;
  }
};