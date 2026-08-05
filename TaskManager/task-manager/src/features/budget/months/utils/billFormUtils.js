/*===========================================================
  getMonthDateRange:
  => Returns the first date, last date, and suggested default
     date for a selected budget month.
===========================================================*/
export const getMonthDateRange = (
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

  const paddedDefaultDay =
    String(defaultDay).padStart(
      2,
      '0'
    );

  const paddedLastDay =
    String(lastDay).padStart(
      2,
      '0'
    );

  return {
    minDate:
      `${year}-${paddedMonth}-01`,

    maxDate:
      `${year}-${paddedMonth}-${paddedLastDay}`,

    defaultDate:
      `${year}-${paddedMonth}-${paddedDefaultDay}`,
  };
};

/*===========================================================
  getInitialBillFormValues:
  => Returns initial values for create, edit, or details mode.
===========================================================*/
export const getInitialBillFormValues = (
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
  getFixedExpenseCategories:
  => Returns alphabetized Fixed Expense categories.
===========================================================*/
export const getFixedExpenseCategories = (
  categories = []
) => {
  return categories
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
    );
};

/*===========================================================
  validateBillForm:
  => Validates bill form values.
===========================================================*/
export const validateBillForm = ({
  formValues,
  minDate,
  maxDate,
  monthLabel,
}) => {
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

  return errors;
};

/*===========================================================
  buildBillRequest:
  => Converts form values into the backend request shape.
===========================================================*/
export const buildBillRequest = (
  formValues
) => {
  return {
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
  };
};