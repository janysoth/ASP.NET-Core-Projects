import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  MONTH_OPTIONS,
  createYearOptions,
} from '@/features/budget/utils';

/*===========================================================
  useBudgetMonthForm:
  => Owns Budget Month form state and validation.

  Handles:
  => Default month / year.
  => Create mode.
  => Edit mode.
  => Planned income.
  => Month / year options.
  => Duplicate Budget Month validation.
  => Field validation.
  => Payload normalization.

  IMPORTANT:
  => Does NOT call the API.
  => Does NOT render UI.
  => Parent form owns submission.
===========================================================*/
const useBudgetMonthFormState = ({
  mode = 'create',

  budgetMonth = null,

  existingBudgetMonths = [],
}) => {
  /*===========================================================
    Current Date:
    => Stable for the lifetime of this form instance.
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
    Edit Mode
  ===========================================================*/
  const isEditing =
    mode === 'edit';

  /*===========================================================
    Month Options
  ===========================================================*/
  const monthOptions =
    MONTH_OPTIONS;

  /*===========================================================
    Year Options:
    => Shared Budget utility.
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

  /*===========================================================
    Load / Reset Form:
    => Edit mode loads existing Budget Month.
    => Create mode restores current defaults.
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
        currentErrors
      ) => {
        if (
          !currentErrors[
          fieldName
          ]
        ) {
          return currentErrors;
        }

        return {
          ...currentErrors,
          [fieldName]:
            undefined,
        };
      }
    );
  };

  /*===========================================================
    Change Month
  ===========================================================*/
  const handleMonthChange = (
    nextMonth
  ) => {
    setMonth(
      Number(
        nextMonth
      )
    );

    clearFieldError(
      'month'
    );
  };

  /*===========================================================
    Change Year
  ===========================================================*/
  const handleYearChange = (
    nextYear
  ) => {
    setYear(
      Number(
        nextYear
      )
    );

    clearFieldError(
      'year'
    );
  };

  /*===========================================================
    Change Planned Income
  ===========================================================*/
  const handlePlannedIncomeChange = (
    nextValue
  ) => {
    setPlannedIncome(
      nextValue
    );

    clearFieldError(
      'plannedIncome'
    );
  };

  /*===========================================================
    Validate:
    => Month must exist.
    => Year must exist.
    => Planned income cannot be negative.
    => Duplicate month/year is blocked during Create mode.
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
      monthOptions.some(
        (
          option
        ) =>
          Number(
            option.value
          ) ===
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
          Number(
            option.value
          ) ===
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
      Duplicate Budget Month:
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
    Create Payload:
    => Returns normalized values for API submission.
    => Returns null when validation fails.
  ===========================================================*/
  const createPayload = () => {
    if (
      !validate()
    ) {
      return null;
    }

    return {
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
    };
  };

  return {
    /*=========================================================
      Mode
    =========================================================*/
    isEditing,

    /*=========================================================
      Options
    =========================================================*/
    monthOptions,
    yearOptions,

    /*=========================================================
      Values
    =========================================================*/
    month,
    year,
    plannedIncome,

    /*=========================================================
      Validation
    =========================================================*/
    validationErrors,

    /*=========================================================
      Field Actions
    =========================================================*/
    handleMonthChange,
    handleYearChange,
    handlePlannedIncomeChange,

    /*=========================================================
      Submission
    =========================================================*/
    validate,
    createPayload,
  };
};

export default useBudgetMonthFormState;