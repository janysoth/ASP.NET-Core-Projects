import React from 'react';

import FinancialTableHeader from './FinancialTableHeader';

/*===========================================================
  FinancialSection:
  => Shared card shell for Budget financial sections.

  Handles:
  => Section card styling.
  => Section header.
  => Optional subtitle.
  => Optional icon.
  => Optional header actions.
  => Optional financial table header.
  => Section content.

  IMPORTANT:
  => Individual features still control:
     - data
     - rows
     - empty states
     - filters
     - business logic
===========================================================*/
const FinancialSection = ({
  title,
  subtitle,

  icon = null,
  actions = null,

  columns = [],
  showTableHeader = true,

  children,

  className = '',
}) => {
  const hasColumns =
    Array.isArray(columns) &&
    columns.length > 0;

  return (
    <section
      className={`
        mt-6
        overflow-hidden
        rounded-2xl
        border
        border-[var(--app-border)]
        bg-[var(--app-surface)]
        shadow-sm

        ${className}
      `}
    >
      {/*=======================================================
        Section Header
      =======================================================*/}
      <div className="flex flex-col gap-4 border-b border-[var(--app-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-[var(--app-text)]">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {subtitle}
            </p>
          )}
        </div>

        {(actions || icon) && (
          <div className="flex shrink-0 items-center gap-3">
            {actions}

            {icon}
          </div>
        )}
      </div>

      {/*=======================================================
        Financial Table Header
      =======================================================*/}
      {showTableHeader &&
        hasColumns && (
          <FinancialTableHeader
            columns={columns}
          />
        )}

      {/*=======================================================
        Section Content
      =======================================================*/}
      {children}
    </section>
  );
};

export default FinancialSection;