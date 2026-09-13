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
  useExpenseSectionActions,
} from './hooks';

/*===========================================================
  BudgetExpenseSection:
  => Displays and manages Expenses for one Budget Month.

  Supports:
  => Add Expense.
  => Edit Expense.
  => Delete Expense.
  => Quick-create Expense Category.
  => Expense Summary.

  IMPORTANT:
  => Orchestration actions live in useExpenseSectionActions.
  => Form/API workflows remain in their dedicated hooks.
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
    Local Categories
  ===========================================================*/
  const [
    availableCategories,
    setAvailableCategories,
  ] = useState(
    categories
  );

  useEffect(() => {
    setAvailableCategories(
      categories
    );
  }, [
    categories,
  ]);

  /*===========================================================
    Table Columns
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
    Eligible Categories
  ===========================================================*/
  const {
    expenseCategories,
  } = useExpenseCategories(
    availableCategories
  );

  /*===========================================================
    Category Quick Create
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
    Section Actions
  ===========================================================*/
  const {
    handleOpenAddExpense,
    handleOpenExpenseEdit,
    handleCloseExpense,
    handleCreateCategory,
  } = useExpenseSectionActions({
    accounts,
    loadAccounts,

    clearCreatedCategory,

    handleOpenCreateExpense,
    handleOpenEditExpense,
    handleCloseExpenseForm,

    handleCreateExpenseCategory,

    setAvailableCategories,

    onBudgetMonthChanged,
  });

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
        subtitle={
          `Expense activity recorded in ${monthLabel}`
        }
        actions={
          sectionActions
        }
        columns={
          expenseRecords.length > 0
            ? tableColumns
            : []
        }
      >
        {/*=====================================================
          Expense Rows
        =====================================================*/}
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
        Quick Create Category
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