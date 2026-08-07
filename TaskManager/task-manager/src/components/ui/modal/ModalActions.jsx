import React from 'react';

/*===========================================================
  ModalActions:
  => Shared modal footer layout.
  => Handles spacing, border, and responsive alignment.
  => Does not control individual button behavior.
===========================================================*/
const ModalActions = ({
  children,
  align = 'end',
}) => {
  const alignmentClass =
    align === 'between'
      ? 'sm:justify-between'
      : align === 'start'
        ? 'sm:justify-start'
        : 'sm:justify-end';

  return (
    <div
      className={`flex flex-col-reverse gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row ${alignmentClass}`}
    >
      {children}
    </div>
  );
};

export default ModalActions;