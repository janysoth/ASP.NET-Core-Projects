import React from 'react';

import DropdownItem from './DropdownItem';

/*===========================================================
  DropdownList:
  => Renders a list of selectable dropdown items.

  Handles:
  => Empty state.
  => Selected item.
  => Scrolling.
  => Maximum height.

  IMPORTANT:
  => Does NOT control open/close state.
===========================================================*/
const DropdownList = ({
  items = [],

  selectedValue,

  onSelect,

  emptyMessage = 'No options found.',
}) => {
  /*===========================================================
    Empty State
  ===========================================================*/
  if (items.length === 0) {
    return (
      <div
        className="
          px-4
          py-6

          text-center
          text-sm

          text-[var(--app-text-muted)]
        "
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="
        max-h-72
        overflow-y-auto

        p-2
      "
    >
      {items.map((item) => (
        <DropdownItem
          key={item.value}
          label={item.label}
          value={item.value}
          selected={
            item.value ===
            selectedValue
          }
          disabled={
            item.disabled
          }
          onSelect={
            onSelect
          }
        />
      ))}
    </div>
  );
};

export default DropdownList;