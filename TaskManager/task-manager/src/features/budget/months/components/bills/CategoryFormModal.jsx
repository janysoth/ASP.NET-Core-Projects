import React, {
  useEffect,
  useState,
} from 'react';

import {
  AppModal,
} from '@/components/ui';

import {
  XIcon,
} from '@/components/icons/Icons';

/*===========================================================
  CategoryFormModal:
  => Creates a Fixed Expense category from inside the
     bill workflow.
  => Uses the shared AppModal wrapper.
===========================================================*/
const CategoryFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  monthLabel,
  submitting = false,
  apiError = '',
}) => {
  const [
    name,
    setName,
  ] = useState('');

  const [
    validationError,
    setValidationError,
  ] = useState('');

  /*===========================================================
    Reset form:
    => Clears old values whenever the modal opens.
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName('');
    setValidationError('');
  }, [
    isOpen,
  ]);

  /*===========================================================
    handleNameChange:
    => Updates category name.
    => Clears previous validation errors.
  ===========================================================*/
  const handleNameChange = (
    event
  ) => {
    setName(
      event.target.value
    );

    if (validationError) {
      setValidationError('');
    }
  };

  /*===========================================================
    handleSubmit:
    => Creates a Fixed Expense category.
    => PlannedAmount starts at zero because the bill itself
       contributes the planned amount.
  ===========================================================*/
  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const normalizedName =
      name.trim();

    if (!normalizedName) {
      setValidationError(
        'Category name is required.'
      );

      return;
    }

    await onSubmit?.({
      name:
        normalizedName,

      type:
        'Expense',

      expenseType:
        'Fixed',

      plannedAmount:
        0,
    });
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      actionInProgress={
        submitting
      }
      zIndex="z-[110]"
      ariaLabelledBy="category-form-title"
      ariaDescribedBy="category-form-description"
    >
      {/*=======================================================
        Header
      =======================================================*/}
      <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border)] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-[var(--app-primary)]">
            {monthLabel}
          </p>

          <h2
            id="category-form-title"
            className="mt-1 text-xl font-bold text-[var(--app-text)]"
          >
            Add fixed expense category
          </h2>

          <p
            id="category-form-description"
            className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]"
          >
            Create a category without leaving the bill form.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close category modal"
          className="rounded-lg p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/*=======================================================
        Form
      =======================================================*/}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 px-5 py-5"
      >
        <div>
          <label
            htmlFor="categoryName"
            className="block text-sm font-semibold text-[var(--app-text)]"
          >
            Category name
          </label>

          <input
            id="categoryName"
            name="categoryName"
            type="text"
            value={name}
            onChange={
              handleNameChange
            }
            disabled={submitting}
            autoFocus
            placeholder="Example: Utilities"
            className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationError
                ? 'border-red-500'
                : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
              }`}
          />

          {validationError && (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              {validationError}
            </p>
          )}
        </div>

        {/*=====================================================
          API error
        =====================================================*/}
        {apiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-sm text-red-700 dark:text-red-300">
              {apiError}
            </p>
          </div>
        )}

        {/*=====================================================
          Fixed category behavior
        =====================================================*/}
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 p-4">
          <p className="text-xs font-medium text-[var(--app-text-muted)]">
            Category type
          </p>

          <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">
            Expense · Fixed
          </p>

          <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">
            The category starts with a planned amount of $0.
            Bills assigned to it contribute their expected
            amounts automatically.
          </p>
        </div>

        {/*=====================================================
          Actions
        =====================================================*/}
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? 'Creating...'
              : 'Create category'}
          </button>
        </div>
      </form>
    </AppModal>
  );
};

export default CategoryFormModal;