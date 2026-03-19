// utils/todoHelpers.js

// Constants
export const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  dueDate: ''
};

export const FILTER_OPTIONS = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

// Date Helpers
export const utcToLocalDateString = (utcIsoString) => {
  if (!utcIsoString) return '';
  // Extract YYYY-MM-DD directly from the ISO string without timezone conversion
  return utcIsoString.split('T')[0];
};

export const localDateToUtcString = (localDateString) => {
  if (!localDateString) return null;
  // Parse as UTC by appending 'T00:00:00Z'
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