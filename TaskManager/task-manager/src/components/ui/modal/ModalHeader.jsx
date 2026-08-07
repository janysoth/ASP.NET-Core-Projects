import React from 'react';

import {
  XIcon,
} from '@/components/icons/Icons';

/*===========================================================
  ModalHeader:
  => Shared modal header.
  => Displays:
     - optional eyebrow text
     - title
     - optional description
     - close button
===========================================================*/
const ModalHeader = ({
  eyebrow,
  title,
  description,
  titleId,
  descriptionId,
  onClose,
  closeDisabled = false,
}) => {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border)] px-5 py-4">
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold text-[var(--app-primary)]">
            {eyebrow}
          </p>
        )}

        <h2
          id={titleId}
          className="mt-1 text-xl font-bold text-[var(--app-text)]"
        >
          {title}
        </h2>

        {description && (
          <p
            id={descriptionId}
            className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]"
          >
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Close modal"
        className="rounded-lg p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ModalHeader;