import {
  useCallback,
  useState,
} from 'react';

import {
  createTransfer,
  patchTransfer,
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
  => Owns the Create / Edit Transfer workflow.

  Handles:
  => Modal state.
  => Create mode.
  => Edit mode.
  => Selected Transfer.
  => Submission state.
  => Create API call.
  => Patch API call.
  => Parent refresh.

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
    Selected Transfer:
    => null means Create mode.
    => Transfer object means Edit mode.
  ===========================================================*/
  const [
    selectedTransfer,
    setSelectedTransfer,
  ] = useState(null);

  /*===========================================================
    Submission State
  ===========================================================*/
  const [
    submittingTransfer,
    setSubmittingTransfer,
  ] = useState(false);

  /*===========================================================
    Form Mode
  ===========================================================*/
  const transferFormMode =
    selectedTransfer
      ? 'edit'
      : 'create';

  /*===========================================================
    Open Create Transfer
  ===========================================================*/
  const handleOpenCreateTransfer =
    useCallback(() => {
      setSelectedTransfer(
        null
      );

      setIsTransferFormOpen(
        true
      );
    }, []);

  /*===========================================================
    Open Edit Transfer
  ===========================================================*/
  const handleOpenEditTransfer =
    useCallback(
      (
        transfer
      ) => {
        if (!transfer) {
          return;
        }

        setSelectedTransfer(
          transfer
        );

        setIsTransferFormOpen(
          true
        );
      },
      []
    );

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

      setSelectedTransfer(
        null
      );
    }, [
      submittingTransfer,
    ]);

  /*===========================================================
    Submit Transfer:
    => Create mode uses POST.
    => Edit mode uses PATCH.
  ===========================================================*/
  const handleTransferSubmit =
    useCallback(
      async (
        formData
      ) => {
        const isEditing =
          Boolean(
            selectedTransfer?.id
          );

        try {
          setSubmittingTransfer(
            true
          );

          if (
            isEditing
          ) {
            await patchTransfer(
              selectedTransfer.id,
              formData
            );
          } else {
            await createTransfer(
              formData
            );
          }

          await onBudgetMonthChanged?.();

          setIsTransferFormOpen(
            false
          );

          setSelectedTransfer(
            null
          );

          showSuccess(
            isEditing
              ? 'Transfer updated successfully.'
              : 'Transfer created successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              isEditing
                ? 'Unable to update transfer.'
                : 'Unable to create transfer.'
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
        selectedTransfer,
        onBudgetMonthChanged,
      ]
    );

  return {
    /*=========================================================
      State
    =========================================================*/
    isTransferFormOpen,
    selectedTransfer,
    transferFormMode,
    submittingTransfer,

    /*=========================================================
      Actions
    =========================================================*/
    handleOpenCreateTransfer,
    handleOpenEditTransfer,
    handleCloseTransferForm,
    handleTransferSubmit,
  };
};

export default useTransferForm;