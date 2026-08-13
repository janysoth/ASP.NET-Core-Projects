import React from 'react';

/*===========================================================
  ExpenseEmptyState:
  => Displayed when the budget month has no expense records.
===========================================================*/
const ExpenseEmptyState = () => {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--app-text)]">
        No expenses
      </p>

      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        There are no expenses recorded for this month.
      </p>
    </div>
  );
};

export default ExpenseEmptyState;