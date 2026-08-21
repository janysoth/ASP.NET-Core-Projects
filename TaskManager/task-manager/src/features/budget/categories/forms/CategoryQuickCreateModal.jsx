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

import {
  BUDGET_CATEGORY_TYPES,
  EXPENSE_TYPES,
} from '@/features/budget/domain';

/*===========================================================
  CategoryQuickCreateModal:
  => Creates an expense category without leaving the current
     workflow.

  Backend Category Model:
  => Type:
     - Expense
     - Savings

  => ExpenseType:
     - Fixed
     - Variable

  Quick Create Rules:
  => This modal only creates Expense categories.
  => User chooses Fixed or Variable.
===========================================================*/
const CategoryQuickCreateModal = ({
  isOpen,
  onClose,
  onSubmit,

  monthLabel,

  submitting = false,
}) => {
  const [
    name,
    setName,
  ] = useState('');

  const [
    expenseType,
    setExpenseType,
  ] = useState(
    EXPENSE_TYPES.VARIABLE
  );

  const [
    plannedAmount,
    setPlannedAmount,
  ] = useState('');

  const [
    validationErrors,
    setValidationErrors,
  ] = useState({});

  /*===========================================================
    Reset Form:
    => Resets values whenever the modal opens.
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName('');

    setExpenseType(
      EXPENSE_TYPES.VARIABLE
    );

    setPlannedAmount('');

    setValidationErrors({});
  }, [
    isOpen,
  ]);

  /*===========================================================
    Validate:
    => Checks category name.
    => Confirms Fixed / Variable classification.
    => Planned amount may be zero or omitted.
  ===========================================================*/
  const validate = () => {
    const errors = {};

    if (
      !name.trim()
    ) {
      errors.name =
        'Category name is required.';
    }

    if (
      expenseType !==
      EXPENSE_TYPES.FIXED &&
      expenseType !==
      EXPENSE_TYPES.VARIABLE
    ) {
      errors.expenseType =
        'Select a valid expense type.';
    }

    const normalizedPlannedAmount =
      plannedAmount === ''
        ? 0
        : Number(
          plannedAmount
        );

    if (
      Number.isNaN(
        normalizedPlannedAmount
      ) ||
      normalizedPlannedAmount < 0
    ) {
      errors.plannedAmount =
        'Planned amount cannot be negative.';
    }

    setValidationErrors(
      errors
    );

    return (
      Object.keys(
        errors
      ).length === 0
    );
  };

  /*===========================================================
    Submit:
    => Maps the UI choice to the backend category model.

    Example:

    UI:
      Variable Expense

    Backend:
      Type        = Expense
      ExpenseType = Variable
  ===========================================================*/
  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        submitting ||
        !validate()
      ) {
        return;
      }

      await onSubmit?.({
        name:
          name.trim(),

        type:
          BUDGET_CATEGORY_TYPES.EXPENSE,

        expenseType,

        plannedAmount:
          plannedAmount === ''
            ? 0
            : Number(
              plannedAmount
            ),
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
      ariaLabelledBy="category-quick-create-title"
      ariaDescribedBy="category-quick-create-description"
    >
      {/*=======================================================
        Header
      =======================================================*/}
      <ModalHeader
        eyebrow={
          monthLabel
        }
        title="Create category"
        description="Add a new expense category without leaving this expense."
        titleId="category-quick-create-title"
        descriptionId="category-quick-create-description"
        onClose={
          onClose
        }
        closeDisabled={
          submitting
        }
      />

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5 px-5 py-5"
      >
        {/*=====================================================
          Category Name
        =====================================================*/}
        <div>
          <label
            htmlFor="quickCategoryName"
            className="block text-sm font-semibold text-[var(--app-text)]"
          >
            Category name
          </label>

          <input
            id="quickCategoryName"
            type="text"
            value={
              name
            }
            onChange={(event) => {
              setName(
                event.target.value
              );

              setValidationErrors(
                (
                  current
                ) => ({
                  ...current,
                  name:
                    undefined,
                })
              );
            }}
            placeholder="Example: Gas"
            disabled={
              submitting
            }
            className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.name
                ? 'border-red-500'
                : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
              }`}
          />

          {validationErrors.name && (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              {
                validationErrors.name
              }
            </p>
          )}
        </div>

        {/*=====================================================
          Expense Type
        =====================================================*/}
        <div>
          <label
            htmlFor="quickCategoryExpenseType"
            className="block text-sm font-semibold text-[var(--app-text)]"
          >
            Type
          </label>

          <select
            id="quickCategoryExpenseType"
            value={
              expenseType
            }
            onChange={(event) => {
              setExpenseType(
                event.target.value
              );

              setValidationErrors(
                (
                  current
                ) => ({
                  ...current,
                  expenseType:
                    undefined,
                })
              );
            }}
            disabled={
              submitting
            }
            className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.expenseType
                ? 'border-red-500'
                : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
              }`}
          >
            <option
              value={
                EXPENSE_TYPES.VARIABLE
              }
            >
              Variable Expense
            </option>

            <option
              value={
                EXPENSE_TYPES.FIXED
              }
            >
              Fixed Expense
            </option>
          </select>

          <p className="mt-2 text-xs text-[var(--app-text-muted)]">
            Fixed expenses are usually managed through Bills, but they can also be recorded manually.
          </p>

          {validationErrors.expenseType && (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              {
                validationErrors.expenseType
              }
            </p>
          )}
        </div>

        {/*=====================================================
          Planned Amount
        =====================================================*/}
        <div>
          <label
            htmlFor="quickCategoryPlannedAmount"
            className="block text-sm font-semibold text-[var(--app-text)]"
          >
            Planned amount

            <span className="ml-1 font-normal text-[var(--app-text-muted)]">
              (optional)
            </span>
          </label>

          <input
            id="quickCategoryPlannedAmount"
            type="number"
            min="0"
            step="0.01"
            value={
              plannedAmount
            }
            onChange={(event) => {
              setPlannedAmount(
                event.target.value
              );

              setValidationErrors(
                (
                  current
                ) => ({
                  ...current,
                  plannedAmount:
                    undefined,
                })
              );
            }}
            placeholder="0.00"
            disabled={
              submitting
            }
            className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.plannedAmount
                ? 'border-red-500'
                : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
              }`}
          />

          {validationErrors.plannedAmount && (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              {
                validationErrors.plannedAmount
              }
            </p>
          )}
        </div>

        {/*=====================================================
          Actions
        =====================================================*/}
        <ModalActions>
          <AppButton
            variant="secondary"
            onClick={
              onClose
            }
            disabled={
              submitting
            }
          >
            Cancel
          </AppButton>

          <AppButton
            type="submit"
            variant="primary"
            loading={
              submitting
            }
            loadingText="Creating category..."
          >
            Create category
          </AppButton>
        </ModalActions>
      </form>
    </AppModal>
  );
};

export default CategoryQuickCreateModal;