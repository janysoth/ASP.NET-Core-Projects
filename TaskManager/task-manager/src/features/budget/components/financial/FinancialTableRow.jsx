import React from 'react';

import {
  getFinancialGridStyle,
} from '@/features/budget/utils/layout';

/*===========================================================
  FinancialTableRow:
  => Shared responsive row layout for Budget financial data.

  Desktop / tablet:
  => Uses the same column definitions as
     FinancialTableHeader.

  Mobile:
  => Stacks vertically so each feature can provide its own
     mobile labels and presentation.

  align:
  => center:
     Vertically centers all columns.

  => start:
     Anchors all columns to the top.

  IMPORTANT:
  => Header and row should always receive the same
     column-definition array.
===========================================================*/
const FinancialTableRow = ({
  columns = [],
  children,
  className = '',
  align = 'center',
}) => {
  /*===========================================================
    Vertical Alignment
  ===========================================================*/
  const alignmentClass =
    align === 'start'
      ? 'md:items-start'
      : 'md:items-center';

  return (
    <div
      className={`
        flex
        flex-col
        gap-4

        px-5
        py-4

        md:grid
        md:gap-4

        ${alignmentClass}
        ${className}
      `}
      style={
        Array.isArray(columns) &&
          columns.length > 0
          ? getFinancialGridStyle(
            columns
          )
          : undefined
      }
    >
      {children}
    </div>
  );
};

export default FinancialTableRow;