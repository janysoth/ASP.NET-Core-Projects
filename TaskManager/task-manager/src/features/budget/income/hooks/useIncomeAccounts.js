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
  useIncomeAccounts:
  => Loads accounts available for income records.

  Rules:
  => Income may go into Checking or Savings accounts.
  => Credit Card accounts are excluded.

  Handles:
  => Accounts.
  => Loading state.
  => Error state.
===========================================================*/
export const useIncomeAccounts = () => {
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
    => Loads financial accounts.
    => Removes Credit Card accounts from Income choices.
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

        const incomeAccounts =
          normalizedAccounts.filter(
            (account) => {
              const accountType =
                String(
                  account.type ?? ''
                )
                  .trim()
                  .toLowerCase();

              return (
                accountType ===
                'checking' ||
                accountType ===
                'savings'
              );
            }
          );

        setAccounts(
          incomeAccounts
        );

        return incomeAccounts;
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