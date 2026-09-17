/*===========================================================
  isExistingAccount:
  => Checks whether an account ID exists.

  Used for:
  => From Account validation.
  => To Account validation.
===========================================================*/
const isExistingAccount = (
  accounts = [],
  accountId
) => {
  if (!accountId) {
    return false;
  }

  return accounts.some(
    (
      account
    ) =>
      account.id ===
      accountId
  );
};

/*===========================================================
  validateTransferForm:
  => Validates Transfer form values.

  Handles:
  => From Account.
  => To Account.
  => Same-account prevention.
  => Amount.
  => Transfer Date.
  => Optional Budget Month date boundaries.

  IMPORTANT:
  => Backend remains the final authority for:
     - Account-type restrictions.
     - Credit-card payment rules.
     - Available-balance rules.
===========================================================*/
export const validateTransferForm = ({
  fromAccountId,
  toAccountId,

  amount,
  transferDate,

  accounts = [],

  minDate = '',
  maxDate = '',

  monthLabel = '',
}) => {
  const errors = {};

  /*===========================================================
    From Account
  ===========================================================*/
  if (!fromAccountId) {
    errors.fromAccountId =
      'From account is required.';
  } else if (
    !isExistingAccount(
      accounts,
      fromAccountId
    )
  ) {
    errors.fromAccountId =
      'Select a valid from account.';
  }

  /*===========================================================
    To Account
  ===========================================================*/
  if (!toAccountId) {
    errors.toAccountId =
      'To account is required.';
  } else if (
    !isExistingAccount(
      accounts,
      toAccountId
    )
  ) {
    errors.toAccountId =
      'Select a valid to account.';
  }

  /*===========================================================
    Same Account
  ===========================================================*/
  if (
    fromAccountId &&
    toAccountId &&
    fromAccountId ===
    toAccountId
  ) {
    errors.toAccountId =
      'From account and to account cannot be the same.';
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
    Transfer Date
  ===========================================================*/
  if (!transferDate) {
    errors.transferDate =
      'Transfer date is required.';
  } else if (
    minDate &&
    transferDate < minDate
  ) {
    errors.transferDate =
      monthLabel
        ? `Transfer date must fall within ${monthLabel}.`
        : 'Transfer date is outside the allowed range.';
  } else if (
    maxDate &&
    transferDate > maxDate
  ) {
    errors.transferDate =
      monthLabel
        ? `Transfer date must fall within ${monthLabel}.`
        : 'Transfer date is outside the allowed range.';
  }

  return errors;
};

/*===========================================================
  buildTransferRequest:
  => Converts Transfer form values into backend request shape.

  Form:
  => transferDate = YYYY-MM-DD

  API:
  => transferDate = YYYY-MM-DDT00:00:00Z
===========================================================*/
export const buildTransferRequest = ({
  fromAccountId,
  toAccountId,

  amount,
  transferDate,

  notes,
}) => {
  return {
    fromAccountId,

    toAccountId,

    amount:
      Number(
        amount
      ),

    transferDate:
      `${transferDate}T00:00:00Z`,

    notes:
      notes?.trim()
        ? notes.trim()
        : null,
  };
};

/*===========================================================
  getInitialTransferFormValues:
  => Returns the default values for a new Transfer.

  IMPORTANT:
  => defaultDate should already be YYYY-MM-DD.
===========================================================*/
export const getInitialTransferFormValues = (
  defaultDate = ''
) => {
  return {
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    transferDate:
      defaultDate,
    notes: '',
  };
};