import {
  useCallback,
  useState,
} from 'react';

import {
  getAccounts,
} from '@/features/budget/api/budgetApi';

import {
  canRecordExpense,
} from '@/features/budget/domain';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

/*===========================================================
  useExpenseAccounts:
  => Loads accounts that may be used for expenses.

  Business Rule:
  => Eligibility is controlled by the Budget domain layer.

  Current Allowed Account Types:
  => Checking
  => Savings
  => Credit Card

  Handles:
  => Accounts.
  => Loading state.
  => Error state.
===========================================================*/
export const useExpenseAccounts = () => {
  const [
    accounts,
    setAccounts,
  ] = useState([]);

  const [
    accountsLoading,
    setAccountsLoading,
  ] = useState(false);

  const [
    accountsError,
    setAccountsError,
  ] = useState('');

  /*===========================================================
    loadAccounts:
    => Loads all accounts from the API.
    => Filters them through the shared domain business rule.
  ===========================================================*/
  const loadAccounts =
    useCallback(async () => {
      try {
        setAccountsLoading(
          true
        );

        setAccountsError('');

        const response =
          await getAccounts();

        const normalizedAccounts =
          Array.isArray(
            response
          )
            ? response
            : [];

        const expenseAccounts =
          normalizedAccounts.filter(
            canRecordExpense
          );

        setAccounts(
          expenseAccounts
        );

        return expenseAccounts;
      } catch (
      requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            'Unable to load accounts.'
          );

        setAccountsError(
          message
        );

        setAccounts([]);

        return [];
      } finally {
        setAccountsLoading(
          false
        );
      }
    }, []);

  return {
    accounts,
    accountsLoading,
    accountsError,
    loadAccounts,
  };
};