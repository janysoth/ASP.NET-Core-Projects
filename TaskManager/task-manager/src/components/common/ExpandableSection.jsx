import React, { useState } from 'react';

const ExpandableSection = ({
  title,
  description,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl bg-white shadow-sm border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-slate-50 transition"
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        <svg
          className={`w-5 h-5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''
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
        <div className="border-t border-slate-100 p-6">
          {children}
        </div>
      )}
    </section>
  );
};

export default ExpandableSection;