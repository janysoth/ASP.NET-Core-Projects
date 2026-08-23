import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  => Collects values for creating or editing a budget month.

  Fields:
  => Month.
  => Year.
  => Planned income.

  Supports:
  => Create mode.
  => Edit mode.

  IMPORTANT:
  => Does not call the API directly.
  => Parent hook controls submission.

  Edit mode:
  => Month and Year remain locked.
  => Planned Income may be updated.
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
    Current Date:
    => Used for default month/year.
    => Memoized so it remains stable for this form instance.
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
    Year Options:
    => Uses shared Budget utility.
    => Defaults to 2 years before and 5 years after
       the current year.
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
    Load / Reset Form:
    => Edit mode loads existing Budget Month.
    => Create mode restores current month/year defaults.
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
    Validate:
    => Month must exist in shared MONTH_OPTIONS.
    => Year must exist in generated year options.
    => Planned income cannot be negative.
    => Duplicate month/year combinations are blocked
       during Create mode.
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
      Month Validation
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
      Year Validation
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
      Planned Income Validation
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
      Duplicate Month Check:
      => Only applies when creating.
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
    Submit:
    => Sends normalized numeric values to the parent.
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
      <div>
        <label
          htmlFor="budgetMonth"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Month
        </label>

        <select
          id="budgetMonth"
          value={
            month
          }
          onChange={(event) => {
            setMonth(
              Number(
                event.target.value
              )
            );

            setValidationErrors(
              (
                current
              ) => ({
                ...current,
                month:
                  undefined,
              })
            );
          }}
          disabled={
            submitting ||
            isEditing
          }
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.month
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        >
          {MONTH_OPTIONS.map(
            (
              option
            ) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            )
          )}
        </select>

        {validationErrors.month && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.month
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Year
      =======================================================*/}
      <div>
        <label
          htmlFor="budgetYear"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Year
        </label>

        <select
          id="budgetYear"
          value={
            year
          }
          onChange={(event) => {
            setYear(
              Number(
                event.target.value
              )
            );

            setValidationErrors(
              (
                current
              ) => ({
                ...current,
                year:
                  undefined,
              })
            );
          }}
          disabled={
            submitting ||
            isEditing
          }
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.year
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        >
          {yearOptions.map(
            (
              option
            ) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            )
          )}
        </select>

        {validationErrors.year && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.year
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Planned Income
      =======================================================*/}
      <div>
        <label
          htmlFor="budgetPlannedIncome"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Planned income
        </label>

        <input
          id="budgetPlannedIncome"
          type="number"
          min="0"
          step="0.01"
          value={
            plannedIncome
          }
          onChange={(event) => {
            setPlannedIncome(
              event.target.value
            );

            setValidationErrors(
              (
                current
              ) => ({
                ...current,
                plannedIncome:
                  undefined,
              })
            );
          }}
          disabled={
            submitting
          }
          placeholder="0.00"
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.plannedIncome
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        />

        <p className="mt-2 text-xs text-[var(--app-text-muted)]">
          Enter the income you expect to receive during this month.
        </p>

        {validationErrors.plannedIncome && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.plannedIncome
            }
          </p>
        )}
      </div>

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