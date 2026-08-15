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

  IMPORTANT:
  => Header and row should always receive the same
     column-definition array.
===========================================================*/
const FinancialTableRow = ({
  columns = [],
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        flex
        flex-col
        gap-4

        px-5
        py-4

        md:grid
        md:items-center
        md:gap-4

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