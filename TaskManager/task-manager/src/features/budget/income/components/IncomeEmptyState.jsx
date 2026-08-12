import React from 'react';

/*===========================================================
  IncomeEmptyState:
  => Displayed when the budget month has no income records.
===========================================================*/
const IncomeEmptyState = () => {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--app-text)]">
        No income records
      </p>

      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        There is no income recorded for this month.
      </p>
    </div>
  );
};

export default IncomeEmptyState;