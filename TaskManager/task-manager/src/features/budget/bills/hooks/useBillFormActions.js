import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  createBill,
  createBudgetCategory,
  updateBill,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useBillFormActions:
  => Owns create/edit bill workflow.

  Handles:
  => Bill form modal state.
  => Selected bill.
  => Create vs edit mode.
  => Creating bills.
  => Updating bills.
  => Creating Fixed Expense categories inline.
  => Refreshing bills and parent budget data.

  IMPORTANT:
  => Payment and delete logic live in separate hooks.
===========================================================*/
export const useBillFormActions = ({
  budgetMonthId,
  categories = [],
  loadBills,
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Available categories:
    => Starts with categories from the parent budget month.
    => May gain a newly-created category from inside BillForm.
  ===========================================================*/
  const [
    availableCategories,
    setAvailableCategories,
  ] = useState(
    categories
  );

  /*===========================================================
    Bill modal state
  ===========================================================*/
  const [
    isBillFormOpen,
    setIsBillFormOpen,
  ] = useState(false);

  const [
    selectedBill,
    setSelectedBill,
  ] = useState(null);

  const [
    billModalMode,
    setBillModalMode,
  ] = useState('create');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  /*===========================================================
    Synchronize categories:
    => Parent budget refresh may return an updated array.
  ===========================================================*/
  useEffect(() => {
    setAvailableCategories(
      categories
    );
  }, [
    categories,
  ]);

  /*===========================================================
    refreshParentBudgetMonth
  ===========================================================*/
  const refreshParentBudgetMonth =
    useCallback(async () => {
      if (
        onBudgetMonthChanged
      ) {
        await onBudgetMonthChanged();
      }
    }, [
      onBudgetMonthChanged,
    ]);

  /*===========================================================
    handleOpenCreateBillForm:
    => Opens an empty form in create mode.
  ===========================================================*/
  const handleOpenCreateBillForm =
    useCallback(() => {
      setSelectedBill(
        null
      );

      setBillModalMode(
        'create'
      );

      setIsBillFormOpen(
        true
      );
    }, []);

  /*===========================================================
    handleOpenBillModal:
    => Unpaid bill = Edit mode.
    => Paid bill   = Details mode.
  ===========================================================*/
  const handleOpenBillModal =
    useCallback(
      (
        bill
      ) => {
        if (!bill) {
          return;
        }

        setSelectedBill(
          bill
        );

        setBillModalMode(
          bill.isPaid
            ? 'details'
            : 'edit'
        );

        setIsBillFormOpen(
          true
        );
      },
      []
    );

  /*===========================================================
    handleCloseBillForm:
    => Prevents closing while create/update is submitting.
  ===========================================================*/
  const handleCloseBillForm =
    useCallback(() => {
      if (
        submitting
      ) {
        return;
      }

      setIsBillFormOpen(
        false
      );

      setSelectedBill(
        null
      );

      setBillModalMode(
        'create'
      );
    }, [
      submitting,
    ]);

  /*===========================================================
    closeBillFormAfterAction:
    => Force-closes the bill modal after another action
       successfully completes.

    Example:
    => Mark Unpaid finishes successfully.
  ===========================================================*/
  const closeBillFormAfterAction =
    useCallback(() => {
      setIsBillFormOpen(
        false
      );

      setSelectedBill(
        null
      );

      setBillModalMode(
        'create'
      );
    }, []);

  /*===========================================================
    handleCreateCategory:
    => Creates a Fixed Expense category from inside BillForm.
    => Adds the returned category to the local dropdown.
  ===========================================================*/
  const handleCreateCategory =
    useCallback(
      async (
        categoryData
      ) => {
        try {
          const createdCategory =
            await createBudgetCategory(
              budgetMonthId,
              categoryData
            );

          setAvailableCategories(
            (
              currentCategories
            ) => {
              const alreadyExists =
                currentCategories.some(
                  (
                    category
                  ) =>
                    category.id ===
                    createdCategory.id
                );

              if (
                alreadyExists
              ) {
                return currentCategories;
              }

              return [
                ...currentCategories,
                createdCategory,
              ];
            }
          );

          showSuccess(
            'Category created successfully.'
          );

          return createdCategory;
        } catch (
        requestError
        ) {
          const message =
            getApiErrorMessage(
              requestError,
              'Unable to create category.'
            );

          /*
            BillForm's category workflow expects a rejected
            promise so it can display the API error.
          */
          throw new Error(
            message
          );
        }
      },
      [
        budgetMonthId,
      ]
    );

  /*===========================================================
    handleBillSubmit:
    => Creates a bill in create mode.
    => Updates the selected bill in edit mode.
  ===========================================================*/
  const handleBillSubmit =
    useCallback(
      async (
        formData
      ) => {
        const isUpdating =
          billModalMode ===
          'edit' &&
          Boolean(
            selectedBill?.id
          );

        try {
          setSubmitting(
            true
          );

          if (isUpdating) {
            await updateBill(
              selectedBill.id,
              formData
            );
          } else {
            await createBill(
              budgetMonthId,
              formData
            );
          }

          if (loadBills) {
            await loadBills();
          }

          await refreshParentBudgetMonth();

          setIsBillFormOpen(
            false
          );

          setSelectedBill(
            null
          );

          setBillModalMode(
            'create'
          );

          showSuccess(
            isUpdating
              ? 'Bill updated successfully.'
              : 'Bill created successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              isUpdating
                ? 'Unable to update bill.'
                : 'Unable to create bill.'
            )
          );

          return false;
        } finally {
          setSubmitting(
            false
          );
        }
      },
      [
        billModalMode,
        selectedBill,
        budgetMonthId,
        loadBills,
        refreshParentBudgetMonth,
      ]
    );

  return {
    availableCategories,

    isBillFormOpen,
    selectedBill,
    billModalMode,
    submitting,

    handleOpenCreateBillForm,
    handleOpenBillModal,
    handleCloseBillForm,
    closeBillFormAfterAction,

    handleCreateCategory,
    handleBillSubmit,
  };
};