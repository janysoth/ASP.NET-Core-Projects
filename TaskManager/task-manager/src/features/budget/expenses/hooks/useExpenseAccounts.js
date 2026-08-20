import {
  useCallback,
  useState,
} from 'react';

import {
  getAccounts,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

/*===========================================================
  useExpenseAccounts:
  => Loads accounts that may be used for expenses.

  Rules:
  => Checking accounts are allowed.
  => Savings accounts are allowed.
  => Credit Card accounts are allowed.

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
    loadAccounts
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

        setAccounts(
          normalizedAccounts
        );

        return normalizedAccounts;
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