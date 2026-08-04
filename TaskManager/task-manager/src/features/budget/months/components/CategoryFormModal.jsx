import React, {
  useEffect,
  useState,
} from 'react';

import {
  XIcon,
} from '../../../../components/icons/Icons';

/*===========================================================
  CategoryFormModal:
  => Creates a Fixed Expense category from the bill workflow.
  => Category Type and Expense Type are locked to:
     - Type: Expense
     - ExpenseType: Fixed
  => PlannedAmount is submitted as 0 because the bill's
     ExpectedAmount contributes through BillPlannedAmount.
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
    categoryName,
    setCategoryName,
  ] = useState('');

  const [
    validationError,
    setValidationError,
  ] = useState('');

  /*===========================================================
    Reset form:
    => Clears the category name whenever the modal opens.
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCategoryName('');
    setValidationError('');
  }, [
    isOpen,
  ]);

  /*===========================================================
    Escape key:
    => Closes the category modal when Escape is pressed.
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === 'Escape' &&
        !submitting
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    isOpen,
    onClose,
    submitting,
  ]);

  if (!isOpen) {
    return null;
  }

  /*===========================================================
    handleOverlayMouseDown:
    => Closes the modal when the user clicks outside it.
  ===========================================================*/
  const handleOverlayMouseDown = (
    event
  ) => {
    if (
      event.target ===
      event.currentTarget &&
      !submitting
    ) {
      onClose?.();
    }
  };

  /*===========================================================
    handleNameChange:
    => Updates the category name.
    => Clears the previous validation message.
  ===========================================================*/
  const handleNameChange = (
    event
  ) => {
    setCategoryName(
      event.target.value
    );

    if (validationError) {
      setValidationError('');
    }
  };

  /*===========================================================
    handleSubmit:
    => Validates the category name.
    => Sends the normalized request to the parent.
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    const trimmedName =
      categoryName.trim();

    if (!trimmedName) {
      setValidationError(
        'Category name is required.'
      );

      return;
    }

    onSubmit?.({
      name:
        trimmedName,

      type:
        'Expense',

      expenseType:
        'Fixed',

      plannedAmount:
        0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 py-6"
      onMouseDown={
        handleOverlayMouseDown
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl"
      >
        {/*=====================================================
          Header
        =====================================================*/}
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

            <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
              Create a category that can be assigned to this
              bill.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close category form"
            className="rounded-lg p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/*=====================================================
          Form
        =====================================================*/}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-5 py-5"
        >
          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {apiError}
            </div>
          )}

          <div>
            <label
              htmlFor="new-category-name"
              className="block text-sm font-semibold text-[var(--app-text)]"
            >
              Category name
            </label>

            <input
              id="new-category-name"
              type="text"
              value={categoryName}
              onChange={handleNameChange}
              disabled={submitting}
              autoFocus
              placeholder="Example: Utilities"
              className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 ${validationError
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

          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 p-4">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--app-text-muted)]">
                  Category type
                </dt>

                <dd className="font-semibold text-[var(--app-text)]">
                  Expense
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--app-text-muted)]">
                  Expense type
                </dt>

                <dd className="font-semibold text-[var(--app-text)]">
                  Fixed
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--app-text-muted)]">
                  Planned amount
                </dt>

                <dd className="font-semibold text-[var(--app-text)]">
                  $0.00
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-xs leading-5 text-[var(--app-text-muted)]">
              The bill amount will supply this category’s
              planned bill amount, so the category’s separate
              planned amount remains zero.
            </p>
          </div>

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
      </div>
    </div>
  );
};

export default CategoryFormModal;