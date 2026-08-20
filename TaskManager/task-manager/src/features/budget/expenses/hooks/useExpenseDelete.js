import {
  useState,
} from 'react';

import {
  deleteExpense,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useExpenseDelete:
  => Owns the delete-expense workflow.

  Handles:
  => Selected expense record.
  => Confirmation dialog state.
  => Delete submission state.
  => API request.
  => Refreshing the parent budget month.
===========================================================*/
export const useExpenseDelete = ({
  onBudgetMonthChanged,
}) => {
  const [
    deleteExpenseTarget,
    setDeleteExpenseTarget,
  ] = useState(null);

  const [
    deletingExpense,
    setDeletingExpense,
  ] = useState(false);

  /*===========================================================
    Open Delete Confirmation
  ===========================================================*/
  const handleOpenDeleteExpense = (
    expense
  ) => {
    if (!expense) {
      return;
    }

    setDeleteExpenseTarget(
      expense
    );
  };

  /*===========================================================
    Close Delete Confirmation
  ===========================================================*/
  const handleCloseDeleteExpense = () => {
    if (
      deletingExpense
    ) {
      return;
    }

    setDeleteExpenseTarget(
      null
    );
  };

  /*===========================================================
    Delete Expense
  ===========================================================*/
  const handleDeleteExpense =
    async () => {
      if (
        !deleteExpenseTarget?.id
      ) {
        showError(
          'Expense ID is required.'
        );

        return;
      }

      try {
        setDeletingExpense(
          true
        );

        await deleteExpense(
          deleteExpenseTarget.id
        );

        if (
          onBudgetMonthChanged
        ) {
          await onBudgetMonthChanged();
        }

        setDeleteExpenseTarget(
          null
        );

        showSuccess(
          'Expense deleted successfully.'
        );
      } catch (
      requestError
      ) {
        showError(
          getApiErrorMessage(
            requestError,
            'Unable to delete expense.'
          )
        );
      } finally {
        setDeletingExpense(
          false
        );
      }
    };

  return {
    deleteExpenseTarget,
    deletingExpense,

    handleOpenDeleteExpense,
    handleCloseDeleteExpense,
    handleDeleteExpense,
  };
};