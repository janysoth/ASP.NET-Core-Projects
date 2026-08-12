import React from 'react';

import {
  CalendarIcon,
  PlusIcon
} from '@/components/icons/Icons';

/*===========================================================
  BillFormFields:
  => Displays the editable or read-only bill fields.
  => Supports create, edit, and details modes.
===========================================================*/
const BillFormFields = ({
  formValues,
  validationErrors,
  fixedExpenseCategories,
  minDate,
  maxDate,
  isDetailsMode = false,
  actionInProgress = false,
  categorySubmitting = false,
  onChange,
  onOpenCategoryForm,
}) => {
  return (
    <>
      {/*=======================================================
        Fixed Expense category
      =======================================================*/}
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
                onOpenCategoryForm
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
          onChange={onChange}
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
              No Fixed Expense categories exist yet. Use
              “Add new category” to create one.
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

      {/*=======================================================
        Bill name
      =======================================================*/}
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
          onChange={onChange}
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

      {/*=======================================================
        Expected amount and due date
      =======================================================*/}
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
            onChange={onChange}
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
              onChange={onChange}
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

      {/*=======================================================
        Notes
      =======================================================*/}
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
          onChange={onChange}
          disabled={
            actionInProgress ||
            isDetailsMode
          }
          placeholder="Add details about this bill..."
          className="mt-2 w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>
    </>
  );
};

export default BillFormFields;