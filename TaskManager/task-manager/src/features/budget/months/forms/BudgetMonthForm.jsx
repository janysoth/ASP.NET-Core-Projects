import React from 'react';

import {
  MoneyInput,
  SelectInput,
} from '@/components/inputs';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

import {
  useBudgetMonthFormState,
} from '@/features/budget/months/hooks';

/*===========================================================
  BudgetMonthForm:
  => Collects values for creating or editing a Budget Month.

  Fields:
  => Month.
  => Year.
  => Planned Income.

  Supports:
  => Create mode.
  => Edit mode.

  IMPORTANT:
  => Does not call the API directly.
  => Parent hook controls submission.
  => Form state and validation live in useBudgetMonthForm.
===========================================================*/
const BudgetMonthForm = ({
  mode = 'create',

  budgetMonth = null,

  existingBudgetMonths = [],

  onSubmit,
  onCancel,

  submitting = false,
}) => {
  /*===========================================================
    Form State / Validation
  ===========================================================*/
  const {
    isEditing,

    monthOptions,
    yearOptions,

    month,
    year,
    plannedIncome,

    validationErrors,

    handleMonthChange,
    handleYearChange,
    handlePlannedIncomeChange,

    createPayload,
  } = useBudgetMonthFormState({
    mode,
    budgetMonth,
    existingBudgetMonths,
  });

  /*===========================================================
    Submit
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      submitting
    ) {
      return;
    }

    const payload =
      createPayload();

    if (!payload) {
      return;
    }

    onSubmit?.(
      payload
    );
  };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5"
    >
      {/*=======================================================
        Month
      =======================================================*/}
      <SelectInput
        label="Month"
        htmlFor="budgetMonth"
        name="month"
        value={
          month
        }
        options={
          monthOptions
        }
        onChange={(event) =>
          handleMonthChange(
            event.target.value
          )
        }
        disabled={
          submitting ||
          isEditing
        }
        error={
          validationErrors.month
        }
      />

      {/*=======================================================
        Year
      =======================================================*/}
      <SelectInput
        label="Year"
        htmlFor="budgetYear"
        name="year"
        value={
          year
        }
        options={
          yearOptions
        }
        onChange={(event) =>
          handleYearChange(
            event.target.value
          )
        }
        disabled={
          submitting ||
          isEditing
        }
        error={
          validationErrors.year
        }
      />

      {/*=======================================================
        Planned Income
      =======================================================*/}
      <MoneyInput
        label="Planned income"
        htmlFor="budgetPlannedIncome"
        name="plannedIncome"
        value={
          plannedIncome
        }
        onValueChange={
          handlePlannedIncomeChange
        }
        disabled={
          submitting
        }
        helperText="Enter the income you expect to receive during this month."
        error={
          validationErrors.plannedIncome
        }
      />

      {/*=======================================================
        Actions
      =======================================================*/}
      <ModalActions>
        <AppButton
          variant="secondary"
          onClick={
            onCancel
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
          loadingText={
            isEditing
              ? 'Saving budget month...'
              : 'Creating budget month...'
          }
        >
          {isEditing
            ? 'Save changes'
            : 'Create budget month'}
        </AppButton>
      </ModalActions>
    </form>
  );
};

export default BudgetMonthForm;