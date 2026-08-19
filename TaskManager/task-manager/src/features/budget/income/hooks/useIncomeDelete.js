import {
  useState,
} from 'react';

import {
  deleteIncome,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useIncomeDelete:
  => Owns the delete-income workflow.

  Handles:
  => Selected income record.
  => Confirmation dialog state.
  => Delete submission state.
  => API request.
  => Budget month refresh.
===========================================================*/
export const useIncomeDelete = ({
  onBudgetMonthChanged,
}) => {
  const [
    deleteIncomeTarget,
    setDeleteIncomeTarget,
  ] = useState(null);

  const [
    deletingIncome,
    setDeletingIncome,
  ] = useState(false);

  /*===========================================================
    Open Delete Confirmation
  ===========================================================*/
  const handleOpenDeleteIncome = (
    income
  ) => {
    if (!income) {
      return;
    }

    setDeleteIncomeTarget(
      income
    );
  };

  /*===========================================================
    Close Delete Confirmation
  ===========================================================*/
  const handleCloseDeleteIncome = () => {
    if (
      deletingIncome
    ) {
      return;
    }

    setDeleteIncomeTarget(
      null
    );
  };

  /*===========================================================
    Delete Income
  ===========================================================*/
  const handleDeleteIncome =
    async () => {
      if (
        !deleteIncomeTarget?.id
      ) {
        showError(
          'Income ID is required.'
        );

        return;
      }

      try {
        setDeletingIncome(
          true
        );

        await deleteIncome(
          deleteIncomeTarget.id
        );

        if (
          onBudgetMonthChanged
        ) {
          await onBudgetMonthChanged();
        }

        setDeleteIncomeTarget(
          null
        );

        showSuccess(
          'Income deleted successfully.'
        );
      } catch (
      requestError
      ) {
        showError(
          getApiErrorMessage(
            requestError,
            'Unable to delete income.'
          )
        );
      } finally {
        setDeletingIncome(
          false
        );
      }
    };

  return {
    deleteIncomeTarget,
    deletingIncome,

    handleOpenDeleteIncome,
    handleCloseDeleteIncome,
    handleDeleteIncome,
  };
};