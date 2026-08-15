import React from 'react';

/*===========================================================
  FinancialRows:
  => Shared row-list renderer for Budget financial sections.

  Handles:
  => Empty state.
  => Row dividers.
  => Rendering each financial item.

  IMPORTANT:
  => This component does not know anything about the
     individual feature's data shape.
===========================================================*/
const FinancialRows = ({
  items = [],
  emptyState = null,
  renderRow,
}) => {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return emptyState;
  }

  if (
    typeof renderRow !==
    'function'
  ) {
    return null;
  }

  return (
    <div className="divide-y divide-[var(--app-border)]">
      {items.map(
        (
          item,
          index
        ) =>
          renderRow(
            item,
            index
          )
      )}
    </div>
  );
};

export default FinancialRows;