import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowUpIcon,
  PlusIcon,
} from '@/components/icons/Icons';

import {
  AppButton,
  AppConfirmDialog,
} from '@/components/ui';

import {
  CategoryQuickCreateModal,
} from '@/features/budget/categories/forms';

import {
  FinancialRows,
  FinancialSection,
} from '@/features/budget/components';

import {
  createFinancialColumns,
} from '@/features/budget/utils/layout';

import {
  ExpenseEmptyState,
  ExpenseRow,
  ExpenseSummary,
} from './components';

import {
  ExpenseFormModal,
} from './forms';

import {
  useExpenseAccounts,
  useExpenseCategories,
  useExpenseCategoryCreate,
  useExpenseDelete,
  useExpenseForm,
} from './hooks';

/*===========================================================
  BudgetExpenseSection:
  => Displays and manages expenses for one budget month.

  Supports:
  => Add expense.
  => Edit expense.
  => Delete expense.
  => Quick-create expense category.
  => Expense summary.

  Category workflow:
  => Maintains local available category state.
  => Newly-created category appears immediately.
  => Newly-created category is automatically selected.
  => Parent budget month refreshes afterward.
===========================================================*/
const BudgetExpenseSection = ({
  budgetMonthId,

  expenseRecords = [],
  categories = [],

  plannedExpenses = 0,
  totalExpenses = 0,

  monthLabel,
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Available Categories:
    => Local copy allows newly-created categories to appear
       immediately without waiting for parent refresh.
  ===========================================================*/
  const [
    availableCategories,
    setAvailableCategories,
  ] = useState(
    categories
  );

  /*===========================================================
    Synchronize Parent Categories
  ===========================================================*/
  useEffect(() => {
    setAvailableCategories(
      categories
    );
  }, [
    categories,
  ]);

  /*===========================================================
    Columns
  ===========================================================*/
  const tableColumns =
    useMemo(
      () =>
        createFinancialColumns([
          {
            key: 'expense',
            label: 'Expense',
          },
          {
            key: 'amount',
            label: 'Amount',
          },
          {
            key: 'date',
            label: 'Date',
          },
        ]),
      []
    );

  /*===========================================================
    Accounts
  ===========================================================*/
  const {
    accounts,
    accountsLoading,
    accountsError,
    loadAccounts,
  } = useExpenseAccounts();

  /*===========================================================
    Eligible Categories:
    => Fixed Expense.
    => Variable Expense.
    => Savings / Debt excluded.
  ===========================================================*/
  const {
    expenseCategories,
  } = useExpenseCategories(
    availableCategories
  );

  /*===========================================================
    Quick Create Category
  ===========================================================*/
  const {
    isCategoryFormOpen,
    creatingCategory,
    createdCategoryId,

    handleOpenCategoryForm,
    handleCloseCategoryForm,
    handleCreateExpenseCategory,
    clearCreatedCategory,
  } = useExpenseCategoryCreate({
    budgetMonthId,
  });

  /*===========================================================
    Expense Form
  ===========================================================*/
  const {
    isExpenseFormOpen,
    selectedExpense,
    expenseFormMode,
    submittingExpense,

    handleOpenCreateExpense,
    handleOpenEditExpense,
    handleCloseExpenseForm,
    handleExpenseSubmit,
  } = useExpenseForm({
    budgetMonthId,
    onBudgetMonthChanged,
  });

  /*===========================================================
    Delete Expense
  ===========================================================*/
  const {
    deleteExpenseTarget,
    deletingExpense,

    handleOpenDeleteExpense,
    handleCloseDeleteExpense,
    handleDeleteExpense,
  } = useExpenseDelete({
    onBudgetMonthChanged,
  });

  /*===========================================================
    Ensure Accounts Loaded
  ===========================================================*/
  const ensureAccountsLoaded =
    async () => {
      if (
        accounts.length ===
        0
      ) {
        await loadAccounts();
      }
    };

  /*===========================================================
    Open Create Expense
  ===========================================================*/
  const handleOpenAddExpense =
    async () => {
      clearCreatedCategory();

      handleOpenCreateExpense();

      await ensureAccountsLoaded();
    };

  /*===========================================================
    Open Edit Expense
  ===========================================================*/
  const handleOpenExpenseEdit =
    async (
      expense
    ) => {
      clearCreatedCategory();

      handleOpenEditExpense(
        expense
      );

      await ensureAccountsLoaded();
    };

  /*===========================================================
    Close Expense
  ===========================================================*/
  const handleCloseExpense = () => {
    handleCloseExpenseForm();

    clearCreatedCategory();
  };

  /*===========================================================
    Create Expense Category:
    => Create through hook.
    => Add to local category list immediately.
    => Hook stores createdCategoryId.
    => ExpenseForm automatically selects new category.
    => Refresh parent afterward.
  ===========================================================*/
  const handleCreateCategory =
    async (
      categoryData
    ) => {
      const createdCategory =
        await handleCreateExpenseCategory(
          categoryData
        );

      if (
        !createdCategory?.id
      ) {
        return null;
      }

      /*=======================================================
        Add Category Locally
      =======================================================*/
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

      /*=======================================================
        Refresh Parent Budget Month:
        => Local dropdown is already updated before this runs.
      =======================================================*/
      if (
        onBudgetMonthChanged
      ) {
        await onBudgetMonthChanged();
      }

      return createdCategory;
    };

  /*===========================================================
    Header Actions
  ===========================================================*/
  const sectionActions = (
    <>
      <AppButton
        variant="primary"
        onClick={
          handleOpenAddExpense
        }
      >
        <PlusIcon className="h-4 w-4" />

        <span>
          Add expense
        </span>
      </AppButton>

      <div className="hidden rounded-xl bg-red-100 p-2.5 text-red-700 dark:bg-red-500/15 dark:text-red-300 sm:block">
        <ArrowUpIcon className="h-5 w-5" />
      </div>
    </>
  );

  return (
    <>
      {/*=======================================================
        Expense Section
      =======================================================*/}
      <FinancialSection
        title="Expenses"
        subtitle={`Expense activity recorded in ${monthLabel}`}
        actions={
          sectionActions
        }
        columns={
          expenseRecords.length > 0
            ? tableColumns
            : []
        }
      >
        <FinancialRows
          items={
            expenseRecords
          }
          emptyState={
            <ExpenseEmptyState />
          }
          renderRow={(
            expense
          ) => (
            <ExpenseRow
              key={
                expense.id
              }
              expense={
                expense
              }
              columns={
                tableColumns
              }
              onEdit={
                handleOpenExpenseEdit
              }
              onDelete={
                handleOpenDeleteExpense
              }
            />
          )}
        />

        {/*=====================================================
          Expense Summary
        =====================================================*/}
        {expenseRecords.length > 0 && (
          <ExpenseSummary
            transactionCount={
              expenseRecords.length
            }
            plannedExpenses={
              plannedExpenses
            }
            totalExpenses={
              totalExpenses
            }
          />
        )}
      </FinancialSection>

      {/*=======================================================
        Expense Form Modal
      =======================================================*/}
      <ExpenseFormModal
        mode={
          expenseFormMode
        }
        expense={
          selectedExpense
        }
        isOpen={
          isExpenseFormOpen &&
          !isCategoryFormOpen
        }
        onClose={
          handleCloseExpense
        }
        onSubmit={
          handleExpenseSubmit
        }
        accounts={
          accounts
        }
        categories={
          expenseCategories
        }
        accountsLoading={
          accountsLoading
        }
        accountsError={
          accountsError
        }
        submitting={
          submittingExpense
        }
        monthLabel={
          monthLabel
        }
        createdCategoryId={
          createdCategoryId
        }
        onCreateCategory={
          handleOpenCategoryForm
        }
      />

      {/*=======================================================
        Quick Create Category Modal
      =======================================================*/}
      <CategoryQuickCreateModal
        isOpen={
          isCategoryFormOpen
        }
        onClose={
          handleCloseCategoryForm
        }
        onSubmit={
          handleCreateCategory
        }
        monthLabel={
          monthLabel
        }
        submitting={
          creatingCategory
        }
      />

      {/*=======================================================
        Delete Confirmation
      =======================================================*/}
      <AppConfirmDialog
        isOpen={
          Boolean(
            deleteExpenseTarget
          )
        }
        onClose={
          handleCloseDeleteExpense
        }
        onConfirm={
          handleDeleteExpense
        }
        eyebrow={
          deleteExpenseTarget
            ? monthLabel
            : undefined
        }
        title="Delete expense?"
        description={
          deleteExpenseTarget
            ? `Delete "${deleteExpenseTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete expense"
        cancelText="Cancel"
        variant="danger"
        loading={
          deletingExpense
        }
        loadingText="Deleting..."
      />
    </>
  );
};

export default BudgetExpenseSection;