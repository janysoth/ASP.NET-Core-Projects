import {
  ACCOUNT_TYPES,
} from '../constants';

/*===========================================================
  isCheckingAccount:
  => Returns true when the account is a Checking account.
===========================================================*/
export const isCheckingAccount = (
  account
) => {
  return (
    account?.type ===
    ACCOUNT_TYPES.CHECKING
  );
};

/*===========================================================
  isSavingsAccount:
  => Returns true when the account is a Savings account.
===========================================================*/
export const isSavingsAccount = (
  account
) => {
  return (
    account?.type ===
    ACCOUNT_TYPES.SAVINGS
  );
};

/*===========================================================
  isCreditCardAccount:
  => Returns true when the account is a Credit Card account.
===========================================================*/
export const isCreditCardAccount = (
  account
) => {
  return (
    account?.type ===
    ACCOUNT_TYPES.CREDIT_CARD
  );
};

/*===========================================================
  isDepositAccount:
  => Returns true for accounts that may receive income.

  Allowed:
  => Checking
  => Savings

  Excluded:
  => Credit Card
===========================================================*/
export const isDepositAccount = (
  account
) => {
  return (
    isCheckingAccount(
      account
    ) ||
    isSavingsAccount(
      account
    )
  );
};

/*===========================================================
  isExpenseAccount:
  => Returns true for accounts that may be used to record
     expenses.

  Allowed:
  => Checking
  => Savings
  => Credit Card
===========================================================*/
export const isExpenseAccount = (
  account
) => {
  return (
    isCheckingAccount(
      account
    ) ||
    isSavingsAccount(
      account
    ) ||
    isCreditCardAccount(
      account
    )
  );
};