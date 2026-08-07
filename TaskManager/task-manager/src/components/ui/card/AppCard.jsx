import React from 'react';

/*===========================================================
  AppCard:
  => Shared container used throughout the application.
===========================================================*/
const AppCard = ({
  children,
  className = '',
  padding = 'md',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`
        rounded-xl
        border
        border-[var(--app-border)]
        bg-[var(--app-surface)]
        shadow-sm
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default AppCard;