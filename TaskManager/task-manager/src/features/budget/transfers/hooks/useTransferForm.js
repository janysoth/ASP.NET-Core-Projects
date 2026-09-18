import {
  useCallback,
  useState,
} from 'react';

import {
  createTransfer,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useTransferForm:
  => Owns the Create Transfer workflow.

  Handles:
  => Modal state.
  => Submission state.
  => Create Transfer API call.
  => Parent Budget Month refresh.

  IMPORTANT:
  => Field state and validation live in
     useTransferFormState.
===========================================================*/
const useTransferForm = ({
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Modal State
  ===========================================================*/
  const [
    isTransferFormOpen,
    setIsTransferFormOpen,
  ] = useState(false);

  /*===========================================================
    Submission State
  ===========================================================*/
  const [
    submittingTransfer,
    setSubmittingTransfer,
  ] = useState(false);

  /*===========================================================
    Open Transfer Form
  ===========================================================*/
  const handleOpenTransferForm =
    useCallback(() => {
      setIsTransferFormOpen(
        true
      );
    }, []);

  /*===========================================================
    Close Transfer Form
  ===========================================================*/
  const handleCloseTransferForm =
    useCallback(() => {
      if (
        submittingTransfer
      ) {
        return;
      }

      setIsTransferFormOpen(
        false
      );
    }, [
      submittingTransfer,
    ]);

  /*===========================================================
    Submit Transfer
  ===========================================================*/
  const handleTransferSubmit =
    useCallback(
      async (
        formData
      ) => {
        try {
          setSubmittingTransfer(
            true
          );

          await createTransfer(
            formData
          );

          await onBudgetMonthChanged?.();

          setIsTransferFormOpen(
            false
          );

          showSuccess(
            'Transfer created successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              'Unable to create transfer.'
            )
          );

          return false;
        } finally {
          setSubmittingTransfer(
            false
          );
        }
      },
      [
        onBudgetMonthChanged,
      ]
    );

  return {
    isTransferFormOpen,
    submittingTransfer,

    handleOpenTransferForm,
    handleCloseTransferForm,
    handleTransferSubmit,
  };
};

export default useTransferForm;