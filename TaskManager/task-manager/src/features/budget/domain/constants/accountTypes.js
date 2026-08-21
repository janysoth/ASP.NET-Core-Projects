/*===========================================================
  ACCOUNT_TYPES:
  => Shared financial-account type values.

  IMPORTANT:
  => These values should match the backend exactly.

  Checking:
  => Debit-style account.
  => May receive income.
  => May be used for expenses.

  Savings:
  => Debit-style account.
  => May receive income.
  => May be used for expenses.

  CreditCard:
  => Liability account.
  => Cannot receive income.
  => May be used for expenses.
===========================================================*/
export const ACCOUNT_TYPES = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'CreditCard',
};