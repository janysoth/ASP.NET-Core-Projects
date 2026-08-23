import {
  useState,
} from 'react';

import {
  deleteBudgetMonth,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useBudgetMonthDelete:
  => Owns the delete Budget Month workflow.

  Handles:
  => Selected Budget Month.
  => Confirmation state.
  => Delete submission.
  => Refreshing Budget Months.
===========================================================*/
export const useBudgetMonthDelete = ({
  onBudgetMonthsChanged,
}) => {
  const [
    deleteBudgetMonthTarget,
    setDeleteBudgetMonthTarget,
  ] = useState(null);

  const [
    deletingBudgetMonth,
    setDeletingBudgetMonth,
  ] = useState(false);

  /*===========================================================
    Open Delete Confirmation
  ===========================================================*/
  const handleOpenDeleteBudgetMonth = (
    budgetMonth
  ) => {
    if (!budgetMonth) {
      return;
    }

    setDeleteBudgetMonthTarget(
      budgetMonth
    );
  };

  /*===========================================================
    Close Delete Confirmation
  ===========================================================*/
  const handleCloseDeleteBudgetMonth = () => {
    if (
      deletingBudgetMonth
    ) {
      return;
    }

    setDeleteBudgetMonthTarget(
      null
    );
  };

  /*===========================================================
    Delete Budget Month
  ===========================================================*/
  const handleDeleteBudgetMonth =
    async () => {
      if (
        !deleteBudgetMonthTarget?.id
      ) {
        showError(
          'Budget month ID is required.'
        );

        return;
      }

      try {
        setDeletingBudgetMonth(
          true
        );

        await deleteBudgetMonth(
          deleteBudgetMonthTarget.id
        );

        if (
          onBudgetMonthsChanged
        ) {
          await onBudgetMonthsChanged();
        }

        setDeleteBudgetMonthTarget(
          null
        );

        showSuccess(
          'Budget month deleted successfully.'
        );
      } catch (
      requestError
      ) {
        showError(
          getApiErrorMessage(
            requestError,
            'Unable to delete budget month.'
          )
        );
      } finally {
        setDeletingBudgetMonth(
          false
        );
      }
    };

  return {
    deleteBudgetMonthTarget,
    deletingBudgetMonth,

    handleOpenDeleteBudgetMonth,
    handleCloseDeleteBudgetMonth,
    handleDeleteBudgetMonth,
  };
};