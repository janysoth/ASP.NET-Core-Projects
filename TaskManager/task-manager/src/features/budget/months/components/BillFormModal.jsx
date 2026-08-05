import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarIcon,
  PlusIcon,
  XIcon,
} from '../../../../components/icons/Icons';

import {
  formatCurrency,
  formatUtcDate,
} from '../../utils/budgetFormatters';

import CategoryFormModal from './CategoryFormModal';

/*===========================================================
  getMonthDateRange:
  => Returns the first date, last date, and suggested default
     date for the selected budget month.

  Default date:
  => Uses today's day number.
  => If that day does not exist in the selected month, uses
     the final valid day of that month.
===========================================================*/
const getMonthDateRange = (
  month,
  year
) => {
  if (!month || !year) {
    return {
      minDate: '',
      maxDate: '',
      defaultDate: '',
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

  const todayDay =
    new Date().getDate();

  const defaultDay =
    Math.min(
      todayDay,
      lastDay
    );

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

    defaultDate:
      `${year}-${paddedMonth}-${String(
        defaultDay
      ).padStart(
        2,
        '0'
      )}`,
  };
};

/*===========================================================
  getInitialFormValues:
  => Creates the starting values for the bill form.

  Create mode:
  => Starts with empty values and the suggested due date.

  Edit/details mode:
  => Uses the selected bill's existing values.
===========================================================*/
const getInitialFormValues = (
  bill,
  defaultDate
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
        : defaultDate,

    notes:
      bill?.notes ?? '',
  };
};

/*===========================================================
  BillFormModal:
  => Supports three modes:

     create:
     - Creates a new unpaid bill.

     edit:
     - Updates an existing unpaid bill.

     details:
     - Displays a paid bill as read-only.
     - Allows the payment to be reversed.

  => Also allows a missing Fixed Expense category to be
     created without leaving the bill workflow.
===========================================================*/
const BillFormModal = ({
  mode = 'create',
  isOpen,
  onClose,
  onSubmit,
  onCreateCategory,
  onMarkUnpaid,
  categories = [],
  month,
  year,
  monthLabel,
  bill = null,
  submitting = false,
  reversingPayment = false,
}) => {
  const {
    minDate,
    maxDate,
    defaultDate,
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
    Modal mode
  ===========================================================*/
  const isCreateMode =
    mode === 'create';

  const isEditMode =
    mode === 'edit';

  const isDetailsMode =
    mode === 'details';

  const actionInProgress =
    submitting ||
    reversingPayment;

  /*===========================================================
    Fixed Expense categories:
    => Bills may only use categories where:

       Type = Expense
       ExpenseType = Fixed
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
            (
              firstCategory,
              secondCategory
            ) =>
              (
                firstCategory.name ?? ''
              ).localeCompare(
                secondCategory.name ?? ''
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
      defaultDate
    )
  );

  const [
    validationErrors,
    setValidationErrors,
  ] = useState({});

  const [
    isCategoryFormOpen,
    setIsCategoryFormOpen,
  ] = useState(false);

  const [
    categorySubmitting,
    setCategorySubmitting,
  ] = useState(false);

  const [
    categoryApiError,
    setCategoryApiError,
  ] = useState('');

  /*===========================================================
    Reset the modal:
    => Reloads the selected bill's values whenever the modal
       opens or the selected bill changes.
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(
      getInitialFormValues(
        bill,
        defaultDate
      )
    );

    setValidationErrors({});
    setIsCategoryFormOpen(false);
    setCategoryApiError('');
  }, [
    isOpen,
    bill,
    defaultDate,
    mode,
  ]);

  /*===========================================================
    Escape key:
    => Closes the bill modal when Escape is pressed.
    => Does not close while an action is running.
    => Does not close the bill modal while the nested category
       modal is open.
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
        !actionInProgress &&
        !isCategoryFormOpen
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
    actionInProgress,
    isCategoryFormOpen,
    onClose,
  ]);

  /*===========================================================
    Body scrolling:
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
    handleOverlayMouseDown:
    => Closes the modal when the user clicks the dark overlay.
    => Clicking inside the dialog does not close it.
  ===========================================================*/
  const handleOverlayMouseDown = (
    event
  ) => {
    if (
      event.target ===
      event.currentTarget &&
      !actionInProgress &&
      !isCategoryFormOpen
    ) {
      onClose?.();
    }
  };

  /*===========================================================
    handleChange:
    => Updates one form value.
    => Clears the field's previous validation message.
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
    => Validates editable bill values.
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

    const expectedAmount =
      Number(
        formValues.expectedAmount
      );

    if (
      !formValues.expectedAmount ||
      Number.isNaN(expectedAmount) ||
      expectedAmount <= 0
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
    => Creates or updates a bill.
    => Details mode does not submit the form.
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      isDetailsMode ||
      actionInProgress
    ) {
      return;
    }

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

  /*===========================================================
    handleOpenCategoryForm:
    => Opens the nested Fixed Expense category modal.
  ===========================================================*/
  const handleOpenCategoryForm = () => {
    if (
      actionInProgress ||
      isDetailsMode
    ) {
      return;
    }

    setCategoryApiError('');
    setIsCategoryFormOpen(true);
  };

  /*===========================================================
    handleCloseCategoryForm:
    => Closes the category modal when no category request is
       running.
  ===========================================================*/
  const handleCloseCategoryForm = () => {
    if (categorySubmitting) {
      return;
    }

    setIsCategoryFormOpen(false);
    setCategoryApiError('');
  };

  /*===========================================================
    handleCreateCategory:
    => Creates a Fixed Expense category through the parent.
    => Automatically selects the newly created category.
  ===========================================================*/
  const handleCreateCategory = async (
    categoryData
  ) => {
    if (!onCreateCategory) {
      setCategoryApiError(
        'Category creation is unavailable.'
      );

      return;
    }

    try {
      setCategorySubmitting(true);
      setCategoryApiError('');

      const createdCategory =
        await onCreateCategory(
          categoryData
        );

      if (!createdCategory?.id) {
        throw new Error(
          'The category was created, but no category ID was returned.'
        );
      }

      setFormValues(
        (currentValues) => ({
          ...currentValues,

          budgetCategoryId:
            createdCategory.id,
        })
      );

      setValidationErrors(
        (currentErrors) => {
          const updatedErrors = {
            ...currentErrors,
          };

          delete updatedErrors.budgetCategoryId;

          return updatedErrors;
        }
      );

      setIsCategoryFormOpen(false);
      setCategoryApiError('');
    } catch (requestError) {
      setCategoryApiError(
        requestError?.message ||
        'Unable to create category.'
      );
    } finally {
      setCategorySubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6"
        onMouseDown={
          handleOverlayMouseDown
        }
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bill-form-title"
          className="max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl"
        >
          {/*===================================================
            Header
          ===================================================*/}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border)] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[var(--app-primary)]">
                {monthLabel}
              </p>

              <h2
                id="bill-form-title"
                className="mt-1 text-xl font-bold text-[var(--app-text)]"
              >
                {isCreateMode &&
                  'Add bill'}

                {isEditMode &&
                  'Edit bill'}

                {isDetailsMode &&
                  'Bill details'}
              </h2>

              <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                {isCreateMode &&
                  'Create a fixed expense obligation for this budget month.'}

                {isEditMode &&
                  'Update this fixed expense obligation.'}

                {isDetailsMode &&
                  'Review the bill and its recorded payment details.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={actionInProgress}
              aria-label="Close bill modal"
              className="rounded-lg p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/*===================================================
            Form
          ===================================================*/}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-5 py-5"
          >
            {/*=================================================
              Category
            =================================================*/}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="budgetCategoryId"
                  className="block text-sm font-semibold text-[var(--app-text)]"
                >
                  Fixed expense category
                </label>

                {!isDetailsMode && (
                  <button
                    type="button"
                    onClick={
                      handleOpenCategoryForm
                    }
                    disabled={
                      actionInProgress ||
                      categorySubmitting
                    }
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--app-primary)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PlusIcon className="h-4 w-4" />

                    Add new category
                  </button>
                )}
              </div>

              <select
                id="budgetCategoryId"
                name="budgetCategoryId"
                value={
                  formValues.budgetCategoryId
                }
                onChange={handleChange}
                disabled={
                  actionInProgress ||
                  isDetailsMode
                }
                className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.budgetCategoryId
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

              {!isDetailsMode &&
                fixedExpenseCategories.length ===
                0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No Fixed Expense categories exist yet.
                    Use “Add new category” to create one.
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

            {/*=================================================
              Bill name
            =================================================*/}
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
                disabled={
                  actionInProgress ||
                  isDetailsMode
                }
                placeholder="Example: Mortgage"
                className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.name
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

            {/*=================================================
              Expected amount and due date
            =================================================*/}
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
                  disabled={
                    actionInProgress ||
                    isDetailsMode
                  }
                  placeholder="0.00"
                  className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.expectedAmount
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
                    disabled={
                      actionInProgress ||
                      isDetailsMode
                    }
                    className={`w-full rounded-xl border bg-[var(--app-surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.dueDate
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

            {/*=================================================
              Notes
            =================================================*/}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-semibold text-[var(--app-text)]"
              >
                Notes

                {!isDetailsMode && (
                  <span className="ml-1 font-normal text-[var(--app-text-muted)]">
                    (optional)
                  </span>
                )}
              </label>

              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formValues.notes}
                onChange={handleChange}
                disabled={
                  actionInProgress ||
                  isDetailsMode
                }
                placeholder="Add details about this bill..."
                className="mt-2 w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>

            {/*=================================================
              Paid bill details
            =================================================*/}
            {isDetailsMode && (
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 p-4">
                <h3 className="text-sm font-semibold text-[var(--app-text)]">
                  Payment details
                </h3>

                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-[var(--app-text-muted)]">
                      Status
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      Paid
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-[var(--app-text-muted)]">
                      Paid date
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                      {formatUtcDate(
                        bill?.paidDate,
                        'Not available'
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-[var(--app-text-muted)]">
                      Expected amount
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                      {formatCurrency(
                        bill?.expectedAmount
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-[var(--app-text-muted)]">
                      Actual amount
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                      {bill?.actualAmount != null
                        ? formatCurrency(
                          bill.actualAmount
                        )
                        : 'Not available'}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-[var(--app-text-muted)]">
                      Payment account
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                      {bill?.accountName ||
                        'Unknown account'}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/*=================================================
              Actions
            =================================================*/}
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={actionInProgress}
                className="rounded-xl border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDetailsMode
                  ? 'Close'
                  : 'Cancel'}
              </button>

              {isDetailsMode ? (
                <button
                  type="button"
                  onClick={
                    onMarkUnpaid
                  }
                  disabled={
                    actionInProgress ||
                    !bill?.isPaid
                  }
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reversingPayment
                    ? 'Reversing payment...'
                    : 'Mark unpaid'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    actionInProgress ||
                    fixedExpenseCategories.length ===
                    0
                  }
                  className="rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : isCreateMode
                      ? 'Add bill'
                      : 'Save changes'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/*=======================================================
        Nested category modal
      =======================================================*/}
      <CategoryFormModal
        isOpen={isCategoryFormOpen}
        onClose={
          handleCloseCategoryForm
        }
        onSubmit={
          handleCreateCategory
        }
        monthLabel={monthLabel}
        submitting={
          categorySubmitting
        }
        apiError={
          categoryApiError
        }
      />
    </>
  );
};

export default BillFormModal;