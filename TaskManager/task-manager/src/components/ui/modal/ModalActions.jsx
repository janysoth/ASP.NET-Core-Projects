import React from 'react';

/*===========================================================
  ModalActions:
  => Shared modal footer layout.
  => Handles spacing and responsive alignment.
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
      className={`flex flex-col-reverse gap-3 pt-5 sm:flex-row ${alignmentClass}`}
    >
      {children}
    </div>
  );
};

export default ModalActions;