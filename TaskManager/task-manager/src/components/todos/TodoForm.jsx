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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={formData.title}
            onChange={onChange('title')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-lg"
            disabled={isSubmitting}
          />
        </div>

        {/* Description + Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <textarea
            placeholder="Add a description (optional)"
            value={formData.description}
            onChange={onChange('description')}
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
              onChange={onChange('dueDate')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isDisabled}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]'
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                <PlusIcon className="w-5 h-5" />
                {editingId ? 'Update Todo' : 'Add Todo'}
              </>
            )}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-gray-600 hover:bg-red-500 hover:text-white transition-colors duration-200"
            >
              <XIcon className="w-5 h-5" />
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TodoForm;