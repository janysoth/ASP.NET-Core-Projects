import {
  useCallback,
  useState,
} from 'react';

import {
  createBudgetMonth,
  updateBudgetMonth,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useBudgetMonthForm:
  => Owns create/edit Budget Month workflow.

  Handles:
  => Modal state.
  => Selected budget month.
  => Create/edit mode.
  => Submission state.
  => API calls.
  => Refreshing the Budget Months list.
===========================================================*/
export const useBudgetMonthForm = ({
  onBudgetMonthsChanged,
}) => {
  const [
    isBudgetMonthFormOpen,
    setIsBudgetMonthFormOpen,
  ] = useState(false);

  const [
    selectedBudgetMonth,
    setSelectedBudgetMonth,
  ] = useState(null);

  const [
    budgetMonthFormMode,
    setBudgetMonthFormMode,
  ] = useState('create');

  const [
    submittingBudgetMonth,
    setSubmittingBudgetMonth,
  ] = useState(false);

  /*===========================================================
    Open Create
  ===========================================================*/
  const handleOpenCreateBudgetMonth =
    useCallback(() => {
      setSelectedBudgetMonth(
        null
      );

      setBudgetMonthFormMode(
        'create'
      );

      setIsBudgetMonthFormOpen(
        true
      );
    }, []);

  /*===========================================================
    Open Edit
  ===========================================================*/
  const handleOpenEditBudgetMonth =
    useCallback(
      (
        budgetMonth
      ) => {
        if (!budgetMonth) {
          return;
        }

        setSelectedBudgetMonth(
          budgetMonth
        );

        setBudgetMonthFormMode(
          'edit'
        );

        setIsBudgetMonthFormOpen(
          true
        );
      },
      []
    );

  /*===========================================================
    Close Form
  ===========================================================*/
  const handleCloseBudgetMonthForm =
    useCallback(() => {
      if (
        submittingBudgetMonth
      ) {
        return;
      }

      setIsBudgetMonthFormOpen(
        false
      );

      setSelectedBudgetMonth(
        null
      );

      setBudgetMonthFormMode(
        'create'
      );
    }, [
      submittingBudgetMonth,
    ]);

  /*===========================================================
    Submit:
    => Create mode creates a new month.
    => Edit mode updates planned income for the selected month.
  ===========================================================*/
  const handleBudgetMonthSubmit =
    useCallback(
      async (
        formData
      ) => {
        const isEditing =
          budgetMonthFormMode ===
          'edit' &&
          Boolean(
            selectedBudgetMonth?.id
          );

        try {
          setSubmittingBudgetMonth(
            true
          );

          if (isEditing) {
            await updateBudgetMonth(
              selectedBudgetMonth.id,
              {
                plannedIncome:
                  formData.plannedIncome,
              }
            );
          } else {
            await createBudgetMonth(
              formData
            );
          }

          if (
            onBudgetMonthsChanged
          ) {
            await onBudgetMonthsChanged();
          }

          setIsBudgetMonthFormOpen(
            false
          );

          setSelectedBudgetMonth(
            null
          );

          setBudgetMonthFormMode(
            'create'
          );

          showSuccess(
            isEditing
              ? 'Budget month updated successfully.'
              : 'Budget month created successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              isEditing
                ? 'Unable to update budget month.'
                : 'Unable to create budget month.'
            )
          );

          return false;
        } finally {
          setSubmittingBudgetMonth(
            false
          );
        }
      },
      [
        budgetMonthFormMode,
        selectedBudgetMonth,
        onBudgetMonthsChanged,
      ]
    );

  return {
    isBudgetMonthFormOpen,
    selectedBudgetMonth,
    budgetMonthFormMode,
    submittingBudgetMonth,

    handleOpenCreateBudgetMonth,
    handleOpenEditBudgetMonth,
    handleCloseBudgetMonthForm,
    handleBudgetMonthSubmit,
  };
};