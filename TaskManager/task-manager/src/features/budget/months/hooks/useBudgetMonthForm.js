import {
  useCallback,
  useState,
} from 'react';

import {
  createBudgetMonth,
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

  IMPORTANT:
  => Edit API support will be added next.
===========================================================*/
export const useBudgetMonthForm = ({
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
    Submission State
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
    => Wired now so the modal architecture is ready.
    => Actual update API call will be added next.
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
    Submit Budget Month:
    => Create mode works now.
    => Edit mode will be wired after updateBudgetMonth()
       is added to budgetApi.js.
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

        if (isEditing) {
          showError(
            'Editing budget months is not wired yet.'
          );

          return false;
        }

        try {
          setSubmittingBudgetMonth(
            true
          );

          await createBudgetMonth(
            formData
          );

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
            'Budget month created successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              'Unable to create budget month.'
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