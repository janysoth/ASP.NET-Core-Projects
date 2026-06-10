import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createTodo,
  deleteTodo,
  getTodos,
  patchTodo,
} from '../services/api';

import {
  FILTER_OPTIONS,
  TODO_INITIAL_FORM_STATE,
} from '../utils/constants';

import {
  calculateStats,
  filterTodos,
  localDateToUtcString,
  sortTodosByDueDate,
  utcToLocalDateString,
} from '../utils/helpers';

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState(TODO_INITIAL_FORM_STATE);
  const [filter, setFilter] = useState(FILTER_OPTIONS.ALL);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const filteredTodos = useMemo(() => {
    return sortTodosByDueDate(filterTodos(todos, filter));
  }, [todos, filter]);

  const stats = useMemo(() => {
    return calculateStats(todos);
  }, [todos]);

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getTodos();
      setTodos(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load todos'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleChange = useCallback(
    (field) => (e) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      if (error) setError('');
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!formData.title.trim()) return;

      setIsSubmitting(true);
      setError('');

      try {
        if (editingId) {
          const existingTodo = todos.find(
            (todo) => todo.id === editingId
          );

          const patchPayload = {};
          let hasChanges = false;

          const newTitle = formData.title.trim();

          if (newTitle !== existingTodo.title) {
            patchPayload.title = newTitle;
            hasChanges = true;
          }

          const newDesc =
            formData.description?.trim() || null;

          const currentDesc =
            existingTodo.description || null;

          if (newDesc !== currentDesc) {
            patchPayload.description = newDesc;
            hasChanges = true;
          }

          const newDueDate = formData.dueDate
            ? localDateToUtcString(formData.dueDate)
            : null;

          const currentDueDate =
            existingTodo.dueDateUtc || null;

          if (newDueDate !== currentDueDate) {
            patchPayload.dueDateUtc = newDueDate;
            hasChanges = true;
          }

          if (!hasChanges) {
            setEditingId(null);
            setFormData(TODO_INITIAL_FORM_STATE);
            return;
          }

          await patchTodo(editingId, patchPayload);
          await fetchTodos();

          setEditingId(null);
        } else {
          const payload = {
            title: formData.title.trim(),
            description:
              formData.description?.trim() || null,
            dueDateUtc: formData.dueDate
              ? localDateToUtcString(formData.dueDate)
              : null,
          };

          const response = await createTodo(payload);

          setTodos((prev) => [
            response.data,
            ...prev,
          ]);
        }

        setFormData(TODO_INITIAL_FORM_STATE);
      } catch (err) {
        const errorData = err.response?.data;

        setError(
          errorData?.title ||
          errorData?.message ||
          `Failed to ${editingId ? 'update' : 'create'
          } todo`
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, editingId, todos, fetchTodos]
  );

  const handleToggleComplete = useCallback(
    async (todo) => {
      try {
        await patchTodo(todo.id, {
          isCompleted: !todo.isCompleted,
        });

        setTodos((prev) =>
          prev.map((item) =>
            item.id === todo.id
              ? {
                ...item,
                isCompleted: !item.isCompleted,
              }
              : item
          )
        );
      } catch {
        await fetchTodos();
      }
    },
    [fetchTodos]
  );

  const handleEdit = useCallback((todo) => {
    setEditingId(todo.id);

    setFormData({
      title: todo.title,
      description: todo.description || '',
      dueDate: utcToLocalDateString(todo.dueDateUtc),
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData(TODO_INITIAL_FORM_STATE);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this todo?'
      )
    ) {
      return;
    }

    try {
      await deleteTodo(id);

      setTodos((prev) =>
        prev.filter((todo) => todo.id !== id)
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to delete todo'
      );
    }
  }, []);

  return {
    todos,
    formData,
    filter,
    setFilter,
    stats,
    filteredTodos,
    isLoading,
    isSubmitting,
    error,
    setError,
    editingId,
    handleChange,
    handleSubmit,
    handleCancelEdit,
    handleToggleComplete,
    handleEdit,
    handleDelete,
  };
};