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
  usePaymentAccounts:
  => Loads financial accounts available for bill payments.

  Handles:
  => Account data.
  => Loading state.
  => Error state.
  => Reloading accounts when needed.
===========================================================*/
export const usePaymentAccounts = () => {
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
    => Loads all available financial accounts.
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
            'Unable to load payment accounts.'
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

  /*===========================================================
    clearAccountsError:
    => Allows UI flows to clear a previous account error.
  ===========================================================*/
  const clearAccountsError =
    useCallback(() => {
      setAccountsError('');
    }, []);

  return {
    accounts,
    accountsLoading,
    accountsError,

    loadAccounts,
    clearAccountsError,
  };
};