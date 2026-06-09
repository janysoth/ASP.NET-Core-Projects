const FormButton = ({
  isLoading,
  disabled,
  loadingText,
  children,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`w-full rounded-md py-3 font-semibold transition-all duration-200 ${isDisabled
          ? 'cursor-not-allowed bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
          : 'bg-[var(--app-primary)] text-white hover:bg-[var(--app-primary-hover)] hover:shadow-md active:scale-[0.98]'
        }`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
          >
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>

          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default FormButton;