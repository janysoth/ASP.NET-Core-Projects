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
  useTransferAccounts:
  => Loads Financial Accounts for Transfer forms.

  Used by:
  => From Account.
  => To Account.

  IMPORTANT:
  => Does NOT own Transfer form state.
  => Does NOT create or delete Transfers.
===========================================================*/
const useTransferAccounts = () => {
  /*===========================================================
    Accounts
  ===========================================================*/
  const [
    accounts,
    setAccounts,
  ] = useState([]);

  /*===========================================================
    Loading
  ===========================================================*/
  const [
    accountsLoading,
    setAccountsLoading,
  ] = useState(false);

  /*===========================================================
    Error
  ===========================================================*/
  const [
    accountsError,
    setAccountsError,
  ] = useState('');

  /*===========================================================
    Load Accounts
  ===========================================================*/
  const loadAccounts =
    useCallback(
      async () => {
        try {
          setAccountsLoading(
            true
          );

          setAccountsError('');

          const result =
            await getAccounts();

          setAccounts(
            Array.isArray(
              result
            )
              ? result
              : []
          );

          return result;
        } catch (
        requestError
        ) {
          setAccounts([]);

          setAccountsError(
            getApiErrorMessage(
              requestError,
              'Unable to load accounts.'
            )
          );

          return [];
        } finally {
          setAccountsLoading(
            false
          );
        }
      },
      []
    );

  return {
    accounts,
    accountsLoading,
    accountsError,

    loadAccounts,
  };
};

export default useTransferAccounts;