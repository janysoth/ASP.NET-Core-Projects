import {
  useCallback,
  useState,
} from 'react';

import {
  deleteTransfer,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useTransferDelete:
  => Owns the Transfer delete workflow.

  Handles:
  => Selected Transfer.
  => Confirmation dialog state.
  => Delete API call.
  => Parent refresh.
===========================================================*/
const useTransferDelete = ({
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Delete Target
  ===========================================================*/
  const [
    deleteTransferTarget,
    setDeleteTransferTarget,
  ] = useState(null);

  /*===========================================================
    Deleting State
  ===========================================================*/
  const [
    deletingTransfer,
    setDeletingTransfer,
  ] = useState(false);

  /*===========================================================
    Open Delete Confirmation
  ===========================================================*/
  const handleOpenDeleteTransfer =
    useCallback(
      (
        transfer
      ) => {
        if (!transfer) {
          return;
        }

        setDeleteTransferTarget(
          transfer
        );
      },
      []
    );

  /*===========================================================
    Close Delete Confirmation
  ===========================================================*/
  const handleCloseDeleteTransfer =
    useCallback(() => {
      if (
        deletingTransfer
      ) {
        return;
      }

      setDeleteTransferTarget(
        null
      );
    }, [
      deletingTransfer,
    ]);

  /*===========================================================
    Delete Transfer
  ===========================================================*/
  const handleDeleteTransfer =
    useCallback(
      async () => {
        if (
          !deleteTransferTarget?.id
        ) {
          return false;
        }

        try {
          setDeletingTransfer(
            true
          );

          await deleteTransfer(
            deleteTransferTarget.id
          );

          await onBudgetMonthChanged?.();

          setDeleteTransferTarget(
            null
          );

          showSuccess(
            'Transfer deleted successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              'Unable to delete transfer.'
            )
          );

          return false;
        } finally {
          setDeletingTransfer(
            false
          );
        }
      },
      [
        deleteTransferTarget,
        onBudgetMonthChanged,
      ]
    );

  return {
    deleteTransferTarget,
    deletingTransfer,

    handleOpenDeleteTransfer,
    handleCloseDeleteTransfer,
    handleDeleteTransfer,
  };
};

export default useTransferDelete;