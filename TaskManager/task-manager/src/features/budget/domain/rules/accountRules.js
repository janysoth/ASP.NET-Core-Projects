import {
  ACCOUNT_TYPES,
} from '../constants';

/*===========================================================
  Account Type Rules
===========================================================*/
export const isCheckingAccount = (
  account
) =>
  account?.type ===
  ACCOUNT_TYPES.CHECKING;

export const isSavingsAccount = (
  account
) =>
  account?.type ===
  ACCOUNT_TYPES.SAVINGS;

export const isCreditCardAccount = (
  account
) =>
  account?.type ===
  ACCOUNT_TYPES.CREDIT_CARD;

/*===========================================================
  Business Rules
===========================================================*/

/*
  Income may only be deposited into
  debit accounts.
*/
export const canReceiveIncome = (
  account
) =>
  isCheckingAccount(
    account
  ) ||
  isSavingsAccount(
    account
  );

/*
  Expenses may be recorded against
  any supported account.
*/
export const canRecordExpense = (
  account
) =>
  isCheckingAccount(
    account
  ) ||
  isSavingsAccount(
    account
  ) ||
  isCreditCardAccount(
    account
  );

/*
  Transfers may originate from
  debit accounts.
*/
export const canTransferFrom = (
  account
) =>
  isCheckingAccount(
    account
  ) ||
  isSavingsAccount(
    account
  );

/*
  Transfers may go into
  any account.
*/
export const canTransferTo = (
  account
) =>
  canRecordExpense(
    account
  );