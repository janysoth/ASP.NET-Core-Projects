import {
  useCallback,
  useState,
} from 'react';

import {
  getAccounts,
} from '@/features/budget/api/budgetApi';

import {
  canReceiveIncome,
} from '@/features/budget/domain';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

/*===========================================================
  useIncomeAccounts:
  => Loads accounts available for income records.

  Business Rule:
  => Eligibility is controlled by the Budget domain layer.

  Allowed:
  => Checking
  => Savings

  Excluded:
  => Credit Card

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
    => Loads all accounts from the API.
    => Filters them using the shared deposit-account rule.
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
            canReceiveIncome
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