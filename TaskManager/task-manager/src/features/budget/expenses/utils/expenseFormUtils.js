/*===========================================================
  isExistingItem:
  => Checks whether an ID exists in a collection.

  Used for:
  => Account validation.
  => Category validation.
===========================================================*/
const isExistingItem = (
  items = [],
  id
) => {
  if (!id) {
    return false;
  }

  return items.some(
    (
      item
    ) =>
      item.id === id
  );
};

/*===========================================================
  validateExpenseForm:
  => Validates Expense form values.

  Handles:
  => Account.
  => Category.
  => Expense name.
  => Amount.
  => Expense date.
  => Optional date boundaries.

  Returns:
  => Validation error object.

  Example:
  {
    amount: 'Amount must be greater than 0.'
  }
===========================================================*/
export const validateExpenseForm = ({
  accountId,
  categoryId,
  name,
  amount,
  expenseDate,

  accounts = [],
  categories = [],

  minDate = '',
  maxDate = '',
  monthLabel = '',
}) => {
  const errors = {};

  /*===========================================================
    Account
  ===========================================================*/
  if (!accountId) {
    errors.accountId =
      'Account is required.';
  } else if (
    !isExistingItem(
      accounts,
      accountId
    )
  ) {
    errors.accountId =
      'Select a valid account.';
  }

  /*===========================================================
    Category
  ===========================================================*/
  if (!categoryId) {
    errors.categoryId =
      'Category is required.';
  } else if (
    !isExistingItem(
      categories,
      categoryId
    )
  ) {
    errors.categoryId =
      'Select a valid category.';
  }

  /*===========================================================
    Expense Name
  ===========================================================*/
  if (
    !name?.trim()
  ) {
    errors.name =
      'Expense name is required.';
  }

  /*===========================================================
    Amount
  ===========================================================*/
  const normalizedAmount =
    Number(
      amount
    );

  if (
    !amount ||
    Number.isNaN(
      normalizedAmount
    ) ||
    normalizedAmount <= 0
  ) {
    errors.amount =
      'Amount must be greater than 0.';
  }

  /*===========================================================
    Expense Date
  ===========================================================*/
  if (!expenseDate) {
    errors.expenseDate =
      'Expense date is required.';
  } else if (
    minDate &&
    expenseDate < minDate
  ) {
    errors.expenseDate =
      monthLabel
        ? `Expense date must fall within ${monthLabel}.`
        : 'Expense date is outside the allowed range.';
  } else if (
    maxDate &&
    expenseDate > maxDate
  ) {
    errors.expenseDate =
      monthLabel
        ? `Expense date must fall within ${monthLabel}.`
        : 'Expense date is outside the allowed range.';
  }

  return errors;
};

/*===========================================================
  buildExpenseRequest:
  => Converts Expense form values into the backend request.

  Form:
  => expenseDate = YYYY-MM-DD

  API:
  => expenseDate = YYYY-MM-DDT00:00:00Z
===========================================================*/
export const buildExpenseRequest = ({
  accountId,
  categoryId,
  name,
  amount,
  expenseDate,
  notes,
}) => {
  return {
    accountId,

    categoryId,

    name:
      name.trim(),

    amount:
      Number(
        amount
      ),

    expenseDate:
      `${expenseDate}T00:00:00Z`,

    notes:
      notes?.trim()
        ? notes.trim()
        : null,
  };
};