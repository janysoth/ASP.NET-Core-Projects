import React from 'react';

/*===========================================================
  CategoryEmptyState:
  => Displayed when the budget month has no categories.
===========================================================*/
const CategoryEmptyState = () => {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--app-text)]">
        No categories
      </p>

      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        There are no categories in this budget month.
      </p>
    </div>
  );
};

export default CategoryEmptyState;