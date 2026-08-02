import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarIcon,
  XIcon,
} from '../../../../components/icons/Icons';

/*===========================================================
  getMonthDateRange:
  => Returns the first and last valid date for the selected
     budget month.

  Example:

  month = 2
  year  = 2027

  Result:

  minDate = 2027-02-01
  maxDate = 2027-02-28
===========================================================*/
const getMonthDateRange = (
  month,
  year
) => {
  if (!month || !year) {
    return {
      minDate: '',
      maxDate: '',
    };
  }

  const paddedMonth =
    String(month).padStart(
      2,
      '0'
    );

  const lastDay =
    new Date(
      year,
      month,
      0
    ).getDate();

  return {
    minDate:
      `${year}-${paddedMonth}-01`,

    maxDate:
      `${year}-${paddedMonth}-${String(
        lastDay
      ).padStart(
        2,
        '0'
      )}`,
  };
};

/*===========================================================
  getInitialFormValues:
  => Creates the starting form values.
  => Supports future reuse for editing an existing bill.
===========================================================*/
const getInitialFormValues = (
  bill,
  minDate
) => {
  return {
    budgetCategoryId:
      bill?.budgetCategoryId ?? '',

    name:
      bill?.name ?? '',

    expectedAmount:
      bill?.expectedAmount?.toString() ??
      '',

    dueDate:
      bill?.dueDate
        ? bill.dueDate.slice(
          0,
          10
        )
        : minDate,

    notes:
      bill?.notes ?? '',
  };
};

/*===========================================================
  BillFormModal:
  => Displays the create/edit bill form.
  => Performs frontend validation.
  => Closes when the user:
     - Clicks outside the dialog
     - Presses Escape
     - Clicks Cancel
     - Clicks the close button
  => Does not call the API yet.
===========================================================*/
const BillFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  month,
  year,
  monthLabel,
  bill = null,
  submitting = false,
}) => {
  const {
    minDate,
    maxDate,
  } = useMemo(
    () =>
      getMonthDateRange(
        month,
        year
      ),
    [
      month,
      year,
    ]
  );

  /*===========================================================
    Fixed Expense categories only

    Bills must use Fixed Expense categories according to the
    backend business rules.
  ===========================================================*/
  const fixedExpenseCategories =
    useMemo(
      () =>
        categories
          .filter(
            (category) =>
              category.type
                ?.trim()
                .toLowerCase() ===
              'expense' &&
              category.expenseType
                ?.trim()
                .toLowerCase() ===
              'fixed'
          )
          .sort(
            (first, second) =>
              first.name.localeCompare(
                second.name
              )
          ),
      [
        categories,
      ]
    );

  const [
    formValues,
    setFormValues,
  ] = useState(
    getInitialFormValues(
      bill,
      minDate
    )
  );

  const [
    validationErrors,
    setValidationErrors,
  ] = useState({});

  const isEditMode =
    Boolean(bill);

  /*===========================================================
    Reset form:
    => Resets values whenever the modal opens or the selected
       bill changes.
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(
      getInitialFormValues(
        bill,
        minDate
      )
    );

    setValidationErrors({});
  }, [
    isOpen,
    bill,
    minDate,
  ]);

  /*===========================================================
    Escape key:
    => Closes the modal when Escape is pressed.
    => Does not close while a request is submitting.
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

  /*===========================================================
    Page scrolling:
    => Prevents the page behind the modal from scrolling.
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    isOpen,
  ]);

  if (!isOpen) {
    return null;
  }

  /*===========================================================
    handleOverlayClick:
    => Closes only when the dark overlay itself is clicked.
    => Clicking inside the dialog does not close the modal.
  ===========================================================*/
  const handleOverlayClick = (
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
    handleChange:
    => Updates one form field.
    => Removes the field's old validation error.
  ===========================================================*/
  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormValues(
      (currentValues) => ({
        ...currentValues,
        [name]: value,
      })
    );

    setValidationErrors(
      (currentErrors) => {
        if (!currentErrors[name]) {
          return currentErrors;
        }

        const updatedErrors = {
          ...currentErrors,
        };

        delete updatedErrors[name];

        return updatedErrors;
      }
    );
  };

  /*===========================================================
    validateForm:
    => Validates required fields and selected month boundaries.
  ===========================================================*/
  const validateForm = () => {
    const errors = {};

    if (
      !formValues.budgetCategoryId
        .trim()
    ) {
      errors.budgetCategoryId =
        'Budget category is required.';
    }

    if (!formValues.name.trim()) {
      errors.name =
        'Bill name is required.';
    }

    const amount =
      Number(
        formValues.expectedAmount
      );

    if (
      !formValues.expectedAmount ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      errors.expectedAmount =
        'Expected amount must be greater than 0.';
    }

    if (!formValues.dueDate) {
      errors.dueDate =
        'Due date is required.';
    } else if (
      minDate &&
      maxDate &&
      (
        formValues.dueDate <
        minDate ||
        formValues.dueDate >
        maxDate
      )
    ) {
      errors.dueDate =
        `Due date must fall within ${monthLabel}.`;
    }

    setValidationErrors(
      errors
    );

    return (
      Object.keys(errors).length ===
      0
    );
  };

  /*===========================================================
    handleSubmit:
    => Validates and sends normalized form data to the parent.
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit?.({
      budgetCategoryId:
        formValues.budgetCategoryId,

      name:
        formValues.name.trim(),

      expectedAmount:
        Number(
          formValues.expectedAmount
        ),

      dueDate:
        `${formValues.dueDate}T00:00:00Z`,

      notes:
        formValues.notes.trim()
          ? formValues.notes.trim()
          : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6"
      onMouseDown={
        handleOverlayClick
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-form-title"
        className="max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl"
      >
        {/*=====================================================
          Modal header
        =====================================================*/}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border)] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--app-primary)]">
              {monthLabel}
            </p>

            <h2
              id="bill-form-title"
              className="mt-1 text-xl font-bold text-[var(--app-text)]"
            >
              {isEditMode
                ? 'Edit bill'
                : 'Add bill'}
            </h2>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {isEditMode
                ? 'Update this fixed expense obligation.'
                : 'Create a fixed expense obligation for this budget month.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close bill form"
            className="rounded-lg p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/*=====================================================
          Modal form
        =====================================================*/}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-5 py-5"
        >
          {/*===================================================
            Fixed Expense category
          ===================================================*/}
          <div>
            <label
              htmlFor="budgetCategoryId"
              className="block text-sm font-semibold text-[var(--app-text)]"
            >
              Fixed expense category
            </label>

            <select
              id="budgetCategoryId"
              name="budgetCategoryId"
              value={
                formValues.budgetCategoryId
              }
              onChange={handleChange}
              disabled={
                submitting ||
                fixedExpenseCategories.length ===
                0
              }
              className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 ${validationErrors.budgetCategoryId
                  ? 'border-red-500'
                  : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
                }`}
            >
              <option value="">
                Select a category
              </option>

              {fixedExpenseCategories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>

            {fixedExpenseCategories.length ===
              0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  This budget month has no
                  Fixed Expense categories.
                  Create one before adding a
                  bill.
                </p>
              )}

            {validationErrors.budgetCategoryId && (
              <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {
                  validationErrors.budgetCategoryId
                }
              </p>
            )}
          </div>

          {/*===================================================
            Bill name
          ===================================================*/}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-[var(--app-text)]"
            >
              Bill name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formValues.name}
              onChange={handleChange}
              disabled={submitting}
              placeholder="Example: Mortgage"
              className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 ${validationErrors.name
                  ? 'border-red-500'
                  : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
                }`}
            />

            {validationErrors.name && (
              <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/*===================================================
            Expected amount and due date
          ===================================================*/}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="expectedAmount"
                className="block text-sm font-semibold text-[var(--app-text)]"
              >
                Expected amount
              </label>

              <input
                id="expectedAmount"
                name="expectedAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={
                  formValues.expectedAmount
                }
                onChange={handleChange}
                disabled={submitting}
                placeholder="0.00"
                className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 ${validationErrors.expectedAmount
                    ? 'border-red-500'
                    : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
                  }`}
              />

              {validationErrors.expectedAmount && (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  {
                    validationErrors.expectedAmount
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-semibold text-[var(--app-text)]"
              >
                Due date
              </label>

              <div className="relative mt-2">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)]" />

                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={formValues.dueDate}
                  onChange={handleChange}
                  disabled={submitting}
                  className={`w-full rounded-xl border bg-[var(--app-surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 ${validationErrors.dueDate
                      ? 'border-red-500'
                      : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
                    }`}
                />
              </div>

              {validationErrors.dueDate && (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  {
                    validationErrors.dueDate
                  }
                </p>
              )}
            </div>
          </div>

          {/*===================================================
            Notes
          ===================================================*/}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-[var(--app-text)]"
            >
              Notes

              <span className="ml-1 font-normal text-[var(--app-text-muted)]">
                (optional)
              </span>
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formValues.notes}
              onChange={handleChange}
              disabled={submitting}
              placeholder="Add details about this bill..."
              className="mt-2 w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20"
            />
          </div>

          {/*===================================================
            Form actions
          ===================================================*/}
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
              disabled={
                submitting ||
                fixedExpenseCategories.length ===
                0
              }
              className="rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : isEditMode
                  ? 'Save changes'
                  : 'Add bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillFormModal;