import React from 'react';

/*===========================================================
  FinancialTableHeader:
  => Shared column header for financial list/table layouts.

  columns:
  => Array of column definitions.

  Example:
  [
    {
      label: 'Category',
      className: 'min-w-0 flex-1',
    },
    {
      label: 'Remaining',
      className: 'w-32 text-right',
    },
  ]

  IMPORTANT:
  => Hidden on small screens.
  => Individual rows should provide mobile labels when needed.
===========================================================*/
const FinancialTableHeader = ({
  columns = [],
  className = '',
}) => {
  if (columns.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        hidden
        items-center
        border-b
        border-[var(--app-border)]
        bg-[var(--app-surface-muted)]/40
        px-5
        py-2.5
        md:flex
        ${className}
      `}
    >
      {columns.map(
        (
          column,
          index
        ) => (
          <div
            key={
              column.key ??
              `${column.label}-${index}`
            }
            className={`
              text-xs
              font-semibold
              text-[var(--app-text-muted)]
              ${column.className ?? ''}
            `}
          >
            {column.label}
          </div>
        )
      )}
    </div>
  );
};

export default FinancialTableHeader;