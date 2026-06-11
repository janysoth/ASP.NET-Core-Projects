import { XIcon } from '../../components/icons/Icons';

import AddTodoPrompt from '../../components/todos/AddTodoPrompt';
import TodoFilters from '../../components/todos/TodoFilters';
import TodoFooterStats from '../../components/todos/TodoFooterStats';
import TodoForm from '../../components/todos/TodoForm';
import TodoList from '../../components/todos/TodoList';
import TodosHeader from '../../components/todos/TodosHeader';

import { useTodos } from '../../hooks/useTodos';

const TodosPage = () => {
  const {
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
    showForm,
    handleShowAddForm,
    handleHideForm,
    handleChange,
    handleSubmit,
    handleCancelEdit,
    handleToggleComplete,
    handleEdit,
    handleDelete,
  } = useTodos();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-8 sm:px-6 lg:px-8 app-page-padding">
      <div className="mx-auto max-w-3xl">
        <TodosHeader activeCount={stats.active} />

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-red-100 p-4 text-sm text-red-700 animate-fade-in">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError('')}
              className="text-red-800 hover:text-red-900"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        <AddTodoPrompt
          isOpen={showForm}
          isEditing={!!editingId}
          onAdd={handleShowAddForm}
          onHide={handleHideForm}
        />

        {showForm && (
          <TodoForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancelEdit}
            isSubmitting={isSubmitting}
            editingId={editingId}
          />
        )}

        <TodoFilters
          filter={filter}
          setFilter={setFilter}
          stats={stats}
        />

        <TodoList
          todos={filteredTodos}
          filter={filter}
          isLoading={isLoading}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <TodoFooterStats
          isLoading={isLoading}
          total={todos.length}
          completed={stats.completed}
        />
      </div>
    </div>
  );
};

export default TodosPage;