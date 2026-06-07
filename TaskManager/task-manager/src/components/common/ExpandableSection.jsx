import React, { useState } from 'react';

const ExpandableSection = ({
  title,
  description,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left transition hover:bg-[var(--app-surface-muted)]"
      >
        <div>
          <h2 className="text-xl font-semibold text-[var(--app-text)]">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {description}
            </p>
          )}
        </div>

        <svg
          className={`h-5 w-5 text-[var(--app-text-muted)] transition-transform ${open ? 'rotate-180' : ''
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[var(--app-border)] p-6">
          {children}
        </div>
      )}
    </section>
  );
};

export default ExpandableSection;