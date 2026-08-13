import React from 'react';

/*===========================================================
  CategoryEmptyState:
  => Displays the appropriate empty state based on the
     currently selected category filter.
===========================================================*/
const CategoryEmptyState = ({
  budgetedOnly = false,
}) => {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--app-text)]">
        {budgetedOnly
          ? 'No budgeted categories'
          : 'No categories'}
      </p>

      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        {budgetedOnly
          ? 'No categories have money assigned.'
          : 'There are no categories for this month.'}
      </p>
    </div>
  );
};

export default CategoryEmptyState;