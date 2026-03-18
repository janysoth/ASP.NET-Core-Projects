import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from '../components/icons/Icons';
import { useAuth } from '../context/useAuth';

import { createTodo, deleteTodo, getTodos, patchTodo } from '../services/api';

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  dueDate: ''
};

const FILTER_OPTIONS = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

// Helper: Convert UTC ISO string to local date string (YYYY-MM-DD) for input
const utcToLocalDateString = (utcIsoString) => {
  if (!utcIsoString) return '';
  const date = new Date(utcIsoString);
  // Adjust for timezone offset to get correct local date
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Helper: Convert local date string (YYYY-MM-DD) to UTC ISO string
const localDateToUtcString = (localDateString) => {
  if (!localDateString) return null;
  // Create date at midnight local time, then convert to UTC
  const localDate = new Date(localDateString);
  return localDate.toISOString();
};

const TodosPage = () => {
  // State
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [filter, setFilter] = useState(FILTER_OPTIONS.ALL);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const { user } = useAuth();

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Derived state
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case FILTER_OPTIONS.ACTIVE:
        return todos.filter(todo => !todo.isCompleted);
      case FILTER_OPTIONS.COMPLETED:
        return todos.filter(todo => todo.isCompleted);
      default:
        return todos;
    }
  }, [todos, filter]);

  const stats = useMemo(() => ({
    total: todos.length,
    active: todos.filter(t => !t.isCompleted).length,
    completed: todos.filter(t => t.isCompleted).length
  }), [todos]);

  // API calls
  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getTodos();
      setTodos(response.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load todos';
      setError(message);
      console.error('Fetch todos error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = useCallback((field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (editingId) {
        const existingTodo = todos.find(t => t.id === editingId);
        const patchPayload = {};
        let hasChanges = false;

        const newTitle = formData.title.trim();
        if (newTitle !== existingTodo.title) {
          patchPayload.title = newTitle;
          hasChanges = true;
        }

        const newDesc = formData.description?.trim() || null;
        const currentDesc = existingTodo.description || null;
        if (newDesc !== currentDesc) {
          patchPayload.description = newDesc;
          hasChanges = true;
        }

        // Convert local date to UTC for backend
        const newDueDate = formData.dueDate
          ? localDateToUtcString(formData.dueDate)
          : null;
        const currentDueDate = existingTodo.dueDateUtc || null;

        if (newDueDate !== currentDueDate) {
          patchPayload.dueDateUtc = newDueDate;
          hasChanges = true;
        }

        if (!hasChanges) {
          setEditingId(null);
          setFormData(INITIAL_FORM_STATE);
          return;
        }

        await patchTodo(editingId, patchPayload);
        await fetchTodos();
        setEditingId(null);
      } else {
        // Create new todo
        const payload = {
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          dueDateUtc: formData.dueDate
            ? localDateToUtcString(formData.dueDate)
            : null
        };

        const response = await createTodo(payload);
        setTodos(prev => [response.data, ...prev]);
      }

      setFormData(INITIAL_FORM_STATE);
    } catch (err) {
      const errorData = err.response?.data;
      const message = errorData?.title || errorData?.message || `Failed to ${editingId ? 'update' : 'create'} todo`;
      setError(message);
      console.error('Save todo error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingId, todos, fetchTodos]);

  const handleToggleComplete = useCallback(async (todo) => {
    try {
      const patchPayload = {
        isCompleted: !todo.isCompleted
      };

      await patchTodo(todo.id, patchPayload);

      setTodos(prev => prev.map(t =>
        t.id === todo.id ? { ...t, isCompleted: !t.isCompleted } : t
      ));
    } catch (err) {
      console.error('Toggle complete error:', err);
      await fetchTodos();
    }
  }, [fetchTodos]);

  const handleEdit = useCallback((todo) => {
    setEditingId(todo.id);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      // Convert UTC to local date string for input
      dueDate: utcToLocalDateString(todo.dueDateUtc)
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;

    try {
      await deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete todo';
      setError(message);
      console.error('Delete todo error:', err);
    }
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create date object in local timezone for comparison
    const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
    const isOverdue = localDate < today && !date.isCompleted;

    return {
      display: localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isOverdue
    };
  };

  // Render helpers
  const renderFilterButton = useCallback((key, label, count) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${filter === key
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
    >
      {label}
      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${filter === key ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
        {count}
      </span>
    </button>
  ), [filter]);

  const renderTodoItem = useCallback((todo) => {
    const dueDate = formatDate(todo.dueDateUtc);

    return (
      <div
        key={todo.id}
        className={`group flex items-start gap-3 p-4 bg-white rounded-lg border transition-all duration-200 ${todo.isCompleted
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
          } ${dueDate?.isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
      >
        {/* Checkbox */}
        <button
          onClick={() => handleToggleComplete(todo)}
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
            Created {new Date(todo.createdAtUtc).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => handleEdit(todo)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
            title="Edit"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(todo.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }, [handleToggleComplete, handleEdit, handleDelete]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Todos
          </h1>
          <p className="text-gray-600 mt-2">
            You have <span className="font-semibold text-indigo-600">{stats.active}</span> active
            {stats.active === 1 ? ' todo' : ' todos'} remaining
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 text-red-700 p-4 rounded-lg text-sm animate-fade-in flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-800 hover:text-red-900">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={handleChange('title')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-lg"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <textarea
                placeholder="Add a description (optional)"
                value={formData.description}
                onChange={handleChange('description')}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 resize-none"
                disabled={isSubmitting}
              />
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange('dueDate')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!formData.title.trim() || isSubmitting}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${!formData.title.trim() || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {editingId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5" />
                    {editingId ? 'Update Todo' : 'Add Todo'}
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                >
                  <XIcon className="w-5 h-5" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {renderFilterButton(FILTER_OPTIONS.ALL, 'All', stats.total)}
          {renderFilterButton(FILTER_OPTIONS.ACTIVE, 'Active', stats.active)}
          {renderFilterButton(FILTER_OPTIONS.COMPLETED, 'Completed', stats.completed)}
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500">Loading todos...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === FILTER_OPTIONS.ALL
                  ? 'No todos yet'
                  : filter === FILTER_OPTIONS.ACTIVE
                    ? 'No active todos'
                    : 'No completed todos'}
              </h3>
              <p className="text-gray-500">
                {filter === FILTER_OPTIONS.ALL
                  ? 'Add your first todo above to get started!'
                  : 'Try switching to a different filter.'}
              </p>
            </div>
          ) : (
            filteredTodos.map(renderTodoItem)
          )}
        </div>

        {/* Footer Stats */}
        {!isLoading && todos.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>
              {stats.completed} of {stats.total} completed • {Math.round((stats.completed / stats.total) * 100) || 0}% done
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TodosPage;