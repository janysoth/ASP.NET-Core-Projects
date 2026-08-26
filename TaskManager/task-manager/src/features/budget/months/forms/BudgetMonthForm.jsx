import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  MoneyInput,
  SelectInput,
} from '@/components/forms';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

import {
  MONTH_OPTIONS,
  createYearOptions,
} from '@/features/budget/utils';

/*===========================================================
  BudgetMonthForm:
  => Collects values for creating or editing a Budget Month.

  Fields:
  => Month.
  => Year.
  => Planned income.

  Supports:
  => Create mode.
  => Edit mode.

  Edit Mode:
  => Month and Year remain locked.
  => Planned Income may be updated.

  IMPORTANT:
  => Does not call the API directly.
  => Parent hook owns submission.
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
    Current Date
  ===========================================================*/
  const currentDate =
    useMemo(
      () =>
        new Date(),
      []
    );

  /*===========================================================
    Defaults
  ===========================================================*/
  const defaultMonth =
    currentDate.getMonth() +
    1;

  const defaultYear =
    currentDate.getFullYear();

  /*===========================================================
    Year Options
  ===========================================================*/
  const yearOptions =
    useMemo(
      () =>
        createYearOptions({
          currentYear:
            defaultYear,
        }),
      [
        defaultYear,
      ]
    );

  /*===========================================================
    Form State
  ===========================================================*/
  const [
    month,
    setMonth,
  ] = useState(
    defaultMonth
  );

  const [
    year,
    setYear,
  ] = useState(
    defaultYear
  );

  const [
    plannedIncome,
    setPlannedIncome,
  ] = useState('');

  const [
    validationErrors,
    setValidationErrors,
  ] = useState({});

  const isEditing =
    mode === 'edit';

  /*===========================================================
    Load / Reset Form
  ===========================================================*/
  useEffect(() => {
    if (
      isEditing &&
      budgetMonth
    ) {
      setMonth(
        Number(
          budgetMonth.month
        )
      );

      setYear(
        Number(
          budgetMonth.year
        )
      );

      setPlannedIncome(
        budgetMonth.plannedIncome
          ?.toString() ??
        ''
      );

      setValidationErrors({});

      return;
    }

    setMonth(
      defaultMonth
    );

    setYear(
      defaultYear
    );

    setPlannedIncome('');

    setValidationErrors({});
  }, [
    isEditing,
    budgetMonth,
    defaultMonth,
    defaultYear,
  ]);

  /*===========================================================
    Clear Field Error
  ===========================================================*/
  const clearFieldError = (
    fieldName
  ) => {
    setValidationErrors(
      (
        current
      ) => {
        if (
          !current[
          fieldName
          ]
        ) {
          return current;
        }

        return {
          ...current,
          [fieldName]:
            undefined,
        };
      }
    );
  };

  /*===========================================================
    Validate
  ===========================================================*/
  const validate = () => {
    const errors = {};

    const normalizedMonth =
      Number(
        month
      );

    const normalizedYear =
      Number(
        year
      );

    const normalizedPlannedIncome =
      plannedIncome === ''
        ? 0
        : Number(
          plannedIncome
        );

    /*=========================================================
      Month
    =========================================================*/
    const validMonth =
      MONTH_OPTIONS.some(
        (
          option
        ) =>
          option.value ===
          normalizedMonth
      );

    if (!validMonth) {
      errors.month =
        'Select a valid month.';
    }

    /*=========================================================
      Year
    =========================================================*/
    const validYear =
      yearOptions.some(
        (
          option
        ) =>
          option.value ===
          normalizedYear
      );

    if (!validYear) {
      errors.year =
        'Select a valid year.';
    }

    /*=========================================================
      Planned Income
    =========================================================*/
    if (
      Number.isNaN(
        normalizedPlannedIncome
      ) ||
      normalizedPlannedIncome < 0
    ) {
      errors.plannedIncome =
        'Planned income cannot be negative.';
    }

    /*=========================================================
      Duplicate Month:
      => Create mode only.
    =========================================================*/
    if (
      !isEditing &&
      validMonth &&
      validYear
    ) {
      const duplicateExists =
        existingBudgetMonths.some(
          (
            existingMonth
          ) =>
            Number(
              existingMonth.month
            ) ===
            normalizedMonth &&
            Number(
              existingMonth.year
            ) ===
            normalizedYear
        );

      if (
        duplicateExists
      ) {
        errors.month =
          'This budget month already exists.';
      }
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
    Submit
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      submitting ||
      !validate()
    ) {
      return;
    }

    onSubmit?.({
      month:
        Number(
          month
        ),

      year:
        Number(
          year
        ),

      plannedIncome:
        plannedIncome === ''
          ? 0
          : Number(
            plannedIncome
          ),
    });
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
        onChange={(event) => {
          setMonth(
            Number(
              event.target.value
            )
          );

          clearFieldError(
            'month'
          );
        }}
        options={
          MONTH_OPTIONS
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
        onChange={(event) => {
          setYear(
            Number(
              event.target.value
            )
          );

          clearFieldError(
            'year'
          );
        }}
        options={
          yearOptions
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
        onValueChange={(
          nextValue
        ) => {
          setPlannedIncome(
            nextValue
          );

          clearFieldError(
            'plannedIncome'
          );
        }}
        helperText="Enter the income you expect to receive during this month."
        error={
          validationErrors.plannedIncome
        }
        disabled={
          submitting
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