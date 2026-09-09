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
  => Manages Expenses for one Budget Month.

  Handles:
  => Expense list.
  => Add / edit / delete.
  => Account loading.
  => Category quick-create.
  => Expense summary.
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
    Local Categories:
    => Allows newly-created categories to appear immediately.
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
    Budget Month:
    => Example monthLabel:
       September 2026

    => Produces:
       month = 9
       year = 2026
  ===========================================================*/
  const {
    month,
    year,
  } = useMemo(
    () => {
      const parsedDate =
        new Date(
          `${monthLabel} 1`
        );

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return {
          month: null,
          year: null,
        };
      }

      return {
        month:
          parsedDate.getMonth() +
          1,

        year:
          parsedDate.getFullYear(),
      };
    },
    [
      monthLabel,
    ]
  );

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
    Eligible Expense Categories
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
    Expense Form Workflow
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
    Delete Workflow
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
    Ensure Accounts
  ===========================================================*/
  const ensureAccountsLoaded =
    async () => {
      if (
        accounts.length === 0
      ) {
        await loadAccounts();
      }
    };

  /*===========================================================
    Open Create
  ===========================================================*/
  const handleOpenAddExpense =
    async () => {
      clearCreatedCategory();

      handleOpenCreateExpense();

      await ensureAccountsLoaded();
    };

  /*===========================================================
    Open Edit
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
    Close Expense Form
  ===========================================================*/
  const handleCloseExpense =
    () => {
      handleCloseExpenseForm();

      clearCreatedCategory();
    };

  /*===========================================================
    Create Category:
    => Adds new category locally before parent refresh.
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

          return alreadyExists
            ? currentCategories
            : [
              ...currentCategories,
              createdCategory,
            ];
        }
      );

      await onBudgetMonthChanged?.();

      return createdCategory;
    };

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
        month={
          month
        }
        year={
          year
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
        Category Quick Create
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