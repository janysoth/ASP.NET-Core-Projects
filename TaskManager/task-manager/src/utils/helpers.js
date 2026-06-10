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

// =========================
// DUE DATE STATUS 
// =========================
export const getDueStatusText = (utcIsoString, isCompleted = false) => {
  if (!utcIsoString || isCompleted) return '';

  const date = new Date(utcIsoString);

  const dueDate = new Date(
    date.getTime() + date.getTimezoneOffset() * 60 * 1000
  );

  dueDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }

  if (diffDays === 0) {
    return 'Due today';
  }

  const overdueDays = Math.abs(diffDays);

  return `Overdue: ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'
    } ago`;
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

// Sort Todos by Due Date
export const sortTodosByDueDate = (todos) => {
  return [...todos].sort((a, b) => {
    const aDate = a.dueDateUtc ? new Date(a.dueDateUtc).getTime() : Infinity;
    const bDate = b.dueDateUtc ? new Date(b.dueDateUtc).getTime() : Infinity;

    if (aDate !== bDate) {
      return aDate - bDate; // earliest due date first
    }

    // fallback: newest created first if same due date
    const aCreated = a.createdAtUtc ? new Date(a.createdAtUtc).getTime() : 0;
    const bCreated = b.createdAtUtc ? new Date(b.createdAtUtc).getTime() : 0;

    return bCreated - aCreated;
  });
};

export const getTodayLocalDateString = () => {
  return new Date().toISOString().split('T')[0];
};