import {
  useCallback,
} from 'react';

/*===========================================================
  useExpenseSectionActions:
  => Owns orchestration actions used by BudgetExpenseSection.

  Handles:
  => Ensuring Accounts are loaded.
  => Opening Create Expense.
  => Opening Edit Expense.
  => Closing Expense form.
  => Quick-creating an Expense Category.
  => Updating local Category state.
  => Refreshing the parent Budget Month.

  IMPORTANT:
  => Does NOT render UI.
  => Does NOT own API hooks directly.
  => Receives existing hook actions as dependencies.
===========================================================*/
const useExpenseSectionActions = ({
  accounts = [],

  loadAccounts,

  clearCreatedCategory,

  handleOpenCreateExpense,
  handleOpenEditExpense,
  handleCloseExpenseForm,

  handleCreateExpenseCategory,

  setAvailableCategories,

  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Ensure Accounts Loaded
  ===========================================================*/
  const ensureAccountsLoaded =
    useCallback(
      async () => {
        if (
          accounts.length ===
          0
        ) {
          await loadAccounts?.();
        }
      },
      [
        accounts.length,
        loadAccounts,
      ]
    );

  /*===========================================================
    Open Add Expense
  ===========================================================*/
  const handleOpenAddExpense =
    useCallback(
      async () => {
        clearCreatedCategory?.();

        handleOpenCreateExpense?.();

        await ensureAccountsLoaded();
      },
      [
        clearCreatedCategory,
        handleOpenCreateExpense,
        ensureAccountsLoaded,
      ]
    );

  /*===========================================================
    Open Edit Expense
  ===========================================================*/
  const handleOpenExpenseEdit =
    useCallback(
      async (
        expense
      ) => {
        if (!expense) {
          return;
        }

        clearCreatedCategory?.();

        handleOpenEditExpense?.(
          expense
        );

        await ensureAccountsLoaded();
      },
      [
        clearCreatedCategory,
        handleOpenEditExpense,
        ensureAccountsLoaded,
      ]
    );

  /*===========================================================
    Close Expense Form
  ===========================================================*/
  const handleCloseExpense =
    useCallback(
      () => {
        handleCloseExpenseForm?.();

        clearCreatedCategory?.();
      },
      [
        handleCloseExpenseForm,
        clearCreatedCategory,
      ]
    );

  /*===========================================================
    Create Expense Category
  ===========================================================*/
  const handleCreateCategory =
    useCallback(
      async (
        categoryData
      ) => {
        const createdCategory =
          await handleCreateExpenseCategory?.(
            categoryData
          );

        if (
          !createdCategory?.id
        ) {
          return null;
        }

        /*=====================================================
          Add Category Locally
        =====================================================*/
        setAvailableCategories?.(
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

        /*=====================================================
          Refresh Parent
        =====================================================*/
        await onBudgetMonthChanged?.();

        return createdCategory;
      },
      [
        handleCreateExpenseCategory,
        setAvailableCategories,
        onBudgetMonthChanged,
      ]
    );

  return {
    handleOpenAddExpense,
    handleOpenExpenseEdit,
    handleCloseExpense,
    handleCreateCategory,
  };
};

export default useExpenseSectionActions;