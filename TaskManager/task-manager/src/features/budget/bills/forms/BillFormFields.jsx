import React, {
  useMemo,
} from 'react';

import {
  PlusIcon,
} from '@/components/icons/Icons';

import {
  DateInput,
  MoneyInput,
  SelectInput,
  TextareaInput,
  TextInput,
} from '@/components/inputs';

/*===========================================================
  BillFormFields:
  => Displays editable or read-only Bill fields.

  Supports:
  => Create mode.
  => Edit mode.
  => Details mode.

  Shared Inputs:
  => SelectInput.
  => TextInput.
  => MoneyInput.
  => DateInput.
  => TextareaInput.

  IMPORTANT:
  => Does NOT own form state.
  => Does NOT validate.
  => Parent hook owns field behavior.
===========================================================*/
const BillFormFields = ({
  formValues,
  validationErrors,

  fixedExpenseCategories = [],

  minDate,
  maxDate,

  isDetailsMode = false,
  actionInProgress = false,
  categorySubmitting = false,

  onFieldChange,
  onOpenCategoryForm,
}) => {
  /*===========================================================
    Disabled State
  ===========================================================*/
  const fieldsDisabled =
    actionInProgress ||
    isDetailsMode;

  /*===========================================================
    Category Options
  ===========================================================*/
  const categoryOptions =
    useMemo(
      () => [
        {
          value: '',
          label:
            'Select a category',
        },

        ...fixedExpenseCategories.map(
          (
            category
          ) => ({
            value:
              category.id,

            label:
              category.name,
          })
        ),
      ],
      [
        fixedExpenseCategories,
      ]
    );

  /*===========================================================
    No Categories
  ===========================================================*/
  const noCategories =
    !isDetailsMode &&
    fixedExpenseCategories.length === 0;

  return (
    <>
      {/*=======================================================
        Fixed Expense Category
      =======================================================*/}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
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
              className="
                inline-flex
                items-center
                gap-1.5

                text-sm
                font-semibold
                text-[var(--app-primary)]

                transition-opacity

                hover:underline

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <PlusIcon className="h-4 w-4" />

              Add new category
            </button>
          )}
        </div>

        <SelectInput
          htmlFor="budgetCategoryId"
          name="budgetCategoryId"
          value={
            formValues.budgetCategoryId
          }
          options={
            categoryOptions
          }
          onChange={(event) =>
            onFieldChange?.(
              'budgetCategoryId',
              event.target.value
            )
          }
          disabled={
            fieldsDisabled
          }
          error={
            validationErrors.budgetCategoryId
          }
        />

        {noCategories && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            No Fixed Expense categories exist yet. Use “Add new category” to create one.
          </p>
        )}
      </div>

      {/*=======================================================
        Bill Name
      =======================================================*/}
      <TextInput
        label="Bill name"
        htmlFor="name"
        name="name"
        value={
          formValues.name
        }
        onChange={(event) =>
          onFieldChange?.(
            'name',
            event.target.value
          )
        }
        disabled={
          fieldsDisabled
        }
        placeholder="Example: Mortgage"
        error={
          validationErrors.name
        }
      />

      {/*=======================================================
        Expected Amount / Due Date
      =======================================================*/}
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyInput
          label="Expected amount"
          htmlFor="expectedAmount"
          name="expectedAmount"
          value={
            formValues.expectedAmount
          }
          onValueChange={(value) =>
            onFieldChange?.(
              'expectedAmount',
              value
            )
          }
          disabled={
            fieldsDisabled
          }
          error={
            validationErrors.expectedAmount
          }
        />

        <DateInput
          label="Due date"
          htmlFor="dueDate"
          name="dueDate"
          value={
            formValues.dueDate
          }
          onChange={(value) =>
            onFieldChange?.(
              'dueDate',
              value
            )
          }
          minDate={
            minDate
          }
          maxDate={
            maxDate
          }
          popupAlign="modal-center"
          popupOffset={2}
          disabled={
            fieldsDisabled
          }
          error={
            validationErrors.dueDate
          }
        />
      </div>

      {/*=======================================================
        Notes
      =======================================================*/}
      <TextareaInput
        label="Notes"
        htmlFor="notes"
        name="notes"
        value={
          formValues.notes
        }
        onChange={(event) =>
          onFieldChange?.(
            'notes',
            event.target.value
          )
        }
        disabled={
          fieldsDisabled
        }
        placeholder="Add details about this bill..."
        rows={3}
        optional={
          !isDetailsMode
        }
      />
    </>
  );
};

export default BillFormFields;