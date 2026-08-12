import React, {
  useEffect,
  useState,
} from 'react';

import {
  AppButton,
  AppModal,
  ModalActions,
  ModalHeader,
} from '@/components/ui';

/*===========================================================
  CategoryFormModal:
  => Creates a Fixed Expense category from inside the
     bill workflow.
  => Uses shared AppModal and ModalHeader components.
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
    => Clears its previous validation error.
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
    => PlannedAmount begins at zero because bill expected
       amounts contribute separately to bill planned totals.
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
      isOpen={
        isOpen
      }
      onClose={
        onClose
      }
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
      <ModalHeader
        eyebrow={
          monthLabel
        }
        title="Add fixed expense category"
        description="Create a category without leaving the bill form."
        titleId="category-form-title"
        descriptionId="category-form-description"
        onClose={
          onClose
        }
        closeDisabled={
          submitting
        }
      />

      {/*=======================================================
        Category form
      =======================================================*/}
      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5 px-5 py-5"
      >
        {/*=====================================================
          Category name
        =====================================================*/}
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
            value={
              name
            }
            onChange={
              handleNameChange
            }
            disabled={
              submitting
            }
            autoFocus
            placeholder="Example: Utilities"
            className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationError
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
              }`}
          />

          {validationError && (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              {
                validationError
              }
            </p>
          )}
        </div>

        {/*=====================================================
          API error
        =====================================================*/}
        {apiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-sm text-red-700 dark:text-red-300">
              {
                apiError
              }
            </p>
          </div>
        )}

        {/*=====================================================
          Category behavior
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
        <ModalActions>
          <AppButton
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </AppButton>

          <AppButton
            type="submit"
            variant="primary"
            loading={submitting}
            loadingText="Creating..."
          >
            Create category
          </AppButton>
        </ModalActions>

      </form>
    </AppModal>
  );
};

export default CategoryFormModal;