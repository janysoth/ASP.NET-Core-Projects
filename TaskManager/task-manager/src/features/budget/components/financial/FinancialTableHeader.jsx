import React from 'react';

import {
  getFinancialColumnAlignment,
  getFinancialGridStyle,
} from '@/features/budget/utils/layout';

/*===========================================================
  FinancialTableHeader:
  => Shared financial-table header.

  Uses:
  => Flexible description column.
  => Fixed-width columns defined by the feature.
  => Per-column alignment.

  Example:
  [
    {
      key: 'income',
      label: 'Income',
      flexible: true,
      align: 'left',
    },
    {
      key: 'amount',
      label: 'Amount',
      width: 140,
      align: 'right',
    },
  ]
===========================================================*/
const FinancialTableHeader = ({
  columns = [],
  className = '',
}) => {
  if (
    !Array.isArray(columns) ||
    columns.length === 0
  ) {
    return null;
  }

  return (
    <div
      className={`
        hidden
        border-b
        border-[var(--app-border)]
        bg-[var(--app-surface-muted)]/40
        px-5
        py-3

        md:block

        ${className}
      `}
    >
      <div
        className="grid items-center gap-4"
        style={
          getFinancialGridStyle(
            columns
          )
        }
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
                min-w-0
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-[var(--app-text-muted)]

                ${getFinancialColumnAlignment(
                column.align
              )}
              `}
            >
              {column.label}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FinancialTableHeader;