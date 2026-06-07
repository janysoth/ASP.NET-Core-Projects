import { CalendarIcon, PlusIcon, XIcon } from '../icons/Icons';

const TodoForm = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  editingId,
}) => {
  const isDisabled = !formData.title.trim() || isSubmitting;

  const inputClass =
    'w-full px-4 py-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20 outline-none transition-all duration-200';

  return (
    <div className="mb-6 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={formData.title}
            onChange={onChange('title')}
            className={`${inputClass} text-lg`}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <textarea
            placeholder="Add a description (optional)"
            value={formData.description}
            onChange={onChange('description')}
            rows={2}
            className={`${inputClass} resize-none`}
            disabled={isSubmitting}
          />

          <div className="flex flex-col">
            <label className="mb-1 flex items-center gap-1 text-sm text-[var(--app-text-muted)]">
              <CalendarIcon className="h-4 w-4" />
              Due Date
            </label>

            <input
              type="date"
              value={formData.dueDate}
              onChange={onChange('dueDate')}
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isDisabled}
            className={`flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all duration-200 ${isDisabled
                ? 'cursor-not-allowed bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                : 'bg-[var(--app-primary)] text-white hover:bg-[var(--app-primary-hover)] hover:shadow-md active:scale-[0.98]'
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
                    5.291A7.962 7.962 0 014 12H0c0 3.042
                    1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {editingId ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5" />
                {editingId ? 'Update Todo' : 'Add Todo'}
              </>
            )}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 rounded-lg px-4 py-3 font-semibold text-[var(--app-text-muted)] transition-colors duration-200 hover:bg-red-500 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TodoForm;