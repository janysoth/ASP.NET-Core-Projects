import {
  useCallback,
  useState,
} from 'react';

import {
  createIncome,
  updateIncome,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useIncomeForm:
  => Owns the create/edit income workflow.

  Handles:
  => Modal state.
  => Create mode.
  => Edit mode.
  => Selected income record.
  => Submission state.
  => API calls.
  => Refreshing the parent budget month.
  => Success/error notifications.

  IMPORTANT:
  => This hook does not render UI.
===========================================================*/
export const useIncomeForm = ({
  budgetMonthId,
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Modal State
  ===========================================================*/
  const [
    isIncomeFormOpen,
    setIsIncomeFormOpen,
  ] = useState(false);

  /*===========================================================
    Selected Income
    => null = creating new income.
    => object = editing existing income.
  ===========================================================*/
  const [
    selectedIncome,
    setSelectedIncome,
  ] = useState(null);

  /*===========================================================
    Submission State
  ===========================================================*/
  const [
    submittingIncome,
    setSubmittingIncome,
  ] = useState(false);

  /*===========================================================
    Form Mode
  ===========================================================*/
  const incomeFormMode =
    selectedIncome
      ? 'edit'
      : 'create';

  /*===========================================================
    Open Create Income
  ===========================================================*/
  const handleOpenCreateIncome =
    useCallback(() => {
      setSelectedIncome(
        null
      );

      setIsIncomeFormOpen(
        true
      );
    }, []);

  /*===========================================================
    Open Edit Income
  ===========================================================*/
  const handleOpenEditIncome =
    useCallback(
      (
        income
      ) => {
        if (!income) {
          return;
        }

        setSelectedIncome(
          income
        );

        setIsIncomeFormOpen(
          true
        );
      },
      []
    );

  /*===========================================================
    Close Income Form
  ===========================================================*/
  const handleCloseIncomeForm =
    useCallback(() => {
      if (
        submittingIncome
      ) {
        return;
      }

      setIsIncomeFormOpen(
        false
      );

      setSelectedIncome(
        null
      );
    }, [
      submittingIncome,
    ]);

  /*===========================================================
    Submit Income:
    => Create mode:
       Creates a new income record.

    => Edit mode:
       Updates the selected income record.

    => Refreshes the parent budget month.
    => Closes modal only after success.
  ===========================================================*/
  const handleIncomeSubmit =
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
            selectedIncome?.id
          );

        try {
          setSubmittingIncome(
            true
          );

          if (isEditing) {
            await updateIncome(
              selectedIncome.id,
              formData
            );
          } else {
            await createIncome(
              budgetMonthId,
              formData
            );
          }

          if (
            onBudgetMonthChanged
          ) {
            await onBudgetMonthChanged();
          }

          setIsIncomeFormOpen(
            false
          );

          setSelectedIncome(
            null
          );

          showSuccess(
            isEditing
              ? 'Income updated successfully.'
              : 'Income added successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              isEditing
                ? 'Unable to update income.'
                : 'Unable to add income.'
            )
          );

          return false;
        } finally {
          setSubmittingIncome(
            false
          );
        }
      },
      [
        budgetMonthId,
        onBudgetMonthChanged,
        selectedIncome,
      ]
    );

  return {
    isIncomeFormOpen,
    selectedIncome,
    incomeFormMode,
    submittingIncome,

    handleOpenCreateIncome,
    handleOpenEditIncome,
    handleCloseIncomeForm,
    handleIncomeSubmit,
  };
};