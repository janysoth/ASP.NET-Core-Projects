import React from 'react';

import {
  PlusIcon,
  XIcon,
} from '../icons/Icons';

const AddTodoPrompt = ({
  isOpen,
  isEditing,
  onAdd,
  onHide,
}) => {
  if (isEditing) {
    return null;
  }

  if (isOpen) {
    return (
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onHide}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
        >
          <XIcon className="h-4 w-4" />
          Hide Form
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-center shadow-sm app-card-padding">
      <h3 className="mb-2 text-lg font-semibold text-[var(--app-text)]">
        Ready to get organized?
      </h3>

      <p className="mb-4 text-sm text-[var(--app-text-muted)]">
        Please click the button below to add your task and keep track of what needs to get done.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--app-primary)] px-5 py-3 font-medium text-white transition hover:bg-[var(--app-primary-hover)]"
      >
        <PlusIcon className="h-5 w-5" />
        Add New Task
      </button>
    </div>
  );
};

export default AddTodoPrompt;