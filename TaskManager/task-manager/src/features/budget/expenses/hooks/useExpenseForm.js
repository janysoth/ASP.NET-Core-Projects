import {
  useCallback,
  useState,
} from 'react';

import {
  createExpense,
  updateExpense,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useExpenseForm:
  => Owns the create/edit expense workflow.

  Handles:
  => Modal state.
  => Create mode.
  => Edit mode.
  => Selected expense record.
  => Submission state.
  => API calls.
  => Refreshing the parent budget month.
===========================================================*/
export const useExpenseForm = ({
  budgetMonthId,
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Modal State
  ===========================================================*/
  const [
    isExpenseFormOpen,
    setIsExpenseFormOpen,
  ] = useState(false);

  /*===========================================================
    Selected Expense
  ===========================================================*/
  const [
    selectedExpense,
    setSelectedExpense,
  ] = useState(null);

  /*===========================================================
    Submission State
  ===========================================================*/
  const [
    submittingExpense,
    setSubmittingExpense,
  ] = useState(false);

  /*===========================================================
    Form Mode
  ===========================================================*/
  const expenseFormMode =
    selectedExpense
      ? 'edit'
      : 'create';

  /*===========================================================
    Open Create Expense
  ===========================================================*/
  const handleOpenCreateExpense =
    useCallback(() => {
      setSelectedExpense(
        null
      );

      setIsExpenseFormOpen(
        true
      );
    }, []);

  /*===========================================================
    Open Edit Expense
  ===========================================================*/
  const handleOpenEditExpense =
    useCallback(
      (
        expense
      ) => {
        if (!expense) {
          return;
        }

        setSelectedExpense(
          expense
        );

        setIsExpenseFormOpen(
          true
        );
      },
      []
    );

  /*===========================================================
    Close Expense Form
  ===========================================================*/
  const handleCloseExpenseForm =
    useCallback(() => {
      if (
        submittingExpense
      ) {
        return;
      }

      setIsExpenseFormOpen(
        false
      );

      setSelectedExpense(
        null
      );
    }, [
      submittingExpense,
    ]);

  /*===========================================================
    Submit Expense
  ===========================================================*/
  const handleExpenseSubmit =
    useCallback(
      async (
        formData
      ) => {
        if (
          !budgetMonthId
        ) {
          showError(
            'Budget month ID is required.'
          );

          return false;
        }

        const isEditing =
          Boolean(
            selectedExpense?.id
          );

        try {
          setSubmittingExpense(
            true
          );

          if (
            isEditing
          ) {
            await updateExpense(
              selectedExpense.id,
              formData
            );
          } else {
            await createExpense(
              budgetMonthId,
              formData
            );
          }

          if (
            onBudgetMonthChanged
          ) {
            await onBudgetMonthChanged();
          }

          setIsExpenseFormOpen(
            false
          );

          setSelectedExpense(
            null
          );

          showSuccess(
            isEditing
              ? 'Expense updated successfully.'
              : 'Expense added successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              isEditing
                ? 'Unable to update expense.'
                : 'Unable to add expense.'
            )
          );

          return false;
        } finally {
          setSubmittingExpense(
            false
          );
        }
      },
      [
        budgetMonthId,
        onBudgetMonthChanged,
        selectedExpense,
      ]
    );

  return {
    isExpenseFormOpen,
    selectedExpense,
    expenseFormMode,
    submittingExpense,

    handleOpenCreateExpense,
    handleOpenEditExpense,
    handleCloseExpenseForm,
    handleExpenseSubmit,
  };
};