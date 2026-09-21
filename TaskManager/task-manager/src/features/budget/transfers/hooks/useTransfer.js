import {
  useCallback,
  useState,
} from 'react';

import {
  getTransfers,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

/*===========================================================
  useTransfers:
  => Loads Account Transfers for the logged-in user.

  Handles:
  => Transfer records.
  => Loading state.
  => Error state.
  => Manual refresh.

  IMPORTANT:
  => Backend returns all Transfers.
  => BudgetTransferSection will filter them by Budget Month.
===========================================================*/
const useTransfers = () => {
  /*===========================================================
    Transfers
  ===========================================================*/
  const [
    transfers,
    setTransfers,
  ] = useState([]);

  /*===========================================================
    Loading
  ===========================================================*/
  const [
    transfersLoading,
    setTransfersLoading,
  ] = useState(false);

  /*===========================================================
    Error
  ===========================================================*/
  const [
    transfersError,
    setTransfersError,
  ] = useState('');

  /*===========================================================
    Load Transfers
  ===========================================================*/
  const loadTransfers =
    useCallback(
      async () => {
        try {
          setTransfersLoading(
            true
          );

          setTransfersError('');

          const result =
            await getTransfers();

          const normalizedTransfers =
            Array.isArray(
              result
            )
              ? result
              : [];

          setTransfers(
            normalizedTransfers
          );

          return normalizedTransfers;
        } catch (
        requestError
        ) {
          setTransfers([]);

          setTransfersError(
            getApiErrorMessage(
              requestError,
              'Unable to load transfers.'
            )
          );

          return [];
        } finally {
          setTransfersLoading(
            false
          );
        }
      },
      []
    );

  return {
    transfers,
    transfersLoading,
    transfersError,

    loadTransfers,
  };
};

export default useTransfers;