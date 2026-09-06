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
  => Owns the Create / Edit Budget Month workflow.

  Handles:
  => Modal state.
  => Create mode.
  => Edit mode.
  => Selected Budget Month.
  => API submission.
  => Parent Budget Month list refresh.

  IMPORTANT:
  => Field state and validation belong to
     useBudgetMonthFormState.
===========================================================*/
const useBudgetMonthForm = ({
  onBudgetMonthsChanged,
}) => {
  /*===========================================================
    Modal State
  ===========================================================*/
  const [
    isBudgetMonthFormOpen,
    setIsBudgetMonthFormOpen,
  ] = useState(false);

  /*===========================================================
    Selected Budget Month
  ===========================================================*/
  const [
    selectedBudgetMonth,
    setSelectedBudgetMonth,
  ] = useState(null);

  /*===========================================================
    Form Mode
  ===========================================================*/
  const [
    budgetMonthFormMode,
    setBudgetMonthFormMode,
  ] = useState('create');

  /*===========================================================
    Submitting State
  ===========================================================*/
  const [
    submittingBudgetMonth,
    setSubmittingBudgetMonth,
  ] = useState(false);

  /*===========================================================
    Open Create Form
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
    Open Edit Form
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
    Submit Form:
    => Create when in Create mode.
    => Update selected month when in Edit mode.
  ===========================================================*/
  const handleBudgetMonthSubmit =
    useCallback(
      async (
        formData
      ) => {
        const isUpdating =
          budgetMonthFormMode ===
          'edit' &&
          Boolean(
            selectedBudgetMonth?.id
          );

        try {
          setSubmittingBudgetMonth(
            true
          );

          if (isUpdating) {
            await updateBudgetMonth(
              selectedBudgetMonth.id,
              formData
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
            isUpdating
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
              isUpdating
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

export default useBudgetMonthForm;