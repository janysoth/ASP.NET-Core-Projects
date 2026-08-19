import React, {
  useMemo,
} from 'react';

import {
  ArrowDownIcon,
  PlusIcon,
} from '@/components/icons/Icons';

import {
  AppButton,
  AppConfirmDialog,
} from '@/components/ui';

import {
  FinancialRows,
  FinancialSection,
} from '@/features/budget/components';

import {
  createFinancialColumns,
} from '@/features/budget/utils/layout';

import {
  IncomeEmptyState,
  IncomeRow,
} from './components';

import {
  IncomeFormModal,
} from './forms';

import {
  useIncomeAccounts,
  useIncomeDelete,
  useIncomeForm,
} from './hooks';

/*===========================================================
  BudgetIncomeSection:
  => Displays and manages income records for one budget month.

  Supports:
  => View income records.
  => Add income.
  => Edit income.
  => Delete income.

  Uses:
  => FinancialSection for shared card/header layout.
  => FinancialRows for shared row rendering.
  => FinancialTableRow through IncomeRow.
  => useIncomeAccounts for account loading.
  => useIncomeForm for create/edit workflow.
  => useIncomeDelete for delete workflow.

  Layout:
  => Income | Amount | Date
===========================================================*/
const BudgetIncomeSection = ({
  budgetMonthId,
  incomeRecords = [],
  monthLabel,
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Financial Table Columns
  ===========================================================*/
  const tableColumns =
    useMemo(
      () =>
        createFinancialColumns([
          {
            key: 'income',
            label: 'Income',
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
    Income Accounts
  ===========================================================*/
  const {
    accounts,
    accountsLoading,
    accountsError,
    loadAccounts,
  } = useIncomeAccounts();

  /*===========================================================
    Income Form
  ===========================================================*/
  const {
    isIncomeFormOpen,
    selectedIncome,
    incomeFormMode,
    submittingIncome,

    handleOpenCreateIncome,
    handleOpenEditIncome,
    handleCloseIncomeForm,
    handleIncomeSubmit,
  } = useIncomeForm({
    budgetMonthId,
    onBudgetMonthChanged,
  });

  /*===========================================================
    Income Delete
  ===========================================================*/
  const {
    deleteIncomeTarget,
    deletingIncome,

    handleOpenDeleteIncome,
    handleCloseDeleteIncome,
    handleDeleteIncome,
  } = useIncomeDelete({
    onBudgetMonthChanged,
  });

  /*===========================================================
    ensureAccountsLoaded:
    => Loads eligible income accounts only when needed.
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
    Open Add Income
  ===========================================================*/
  const handleOpenAddIncome =
    async () => {
      handleOpenCreateIncome();

      await ensureAccountsLoaded();
    };

  /*===========================================================
    Open Edit Income
  ===========================================================*/
  const handleOpenIncomeEdit =
    async (
      income
    ) => {
      handleOpenEditIncome(
        income
      );

      await ensureAccountsLoaded();
    };

  /*===========================================================
    Section Actions
  ===========================================================*/
  const sectionActions = (
    <>
      <AppButton
        variant="primary"
        onClick={
          handleOpenAddIncome
        }
      >
        <PlusIcon className="h-4 w-4" />

        <span>
          Add income
        </span>
      </AppButton>

      <div className="hidden rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 sm:block">
        <ArrowDownIcon className="h-5 w-5" />
      </div>
    </>
  );

  return (
    <>
      <FinancialSection
        title="Income"
        subtitle={`Income assigned to ${monthLabel}`}
        actions={
          sectionActions
        }
        columns={
          incomeRecords.length > 0
            ? tableColumns
            : []
        }
      >
        <FinancialRows
          items={
            incomeRecords
          }
          emptyState={
            <IncomeEmptyState />
          }
          renderRow={(
            income
          ) => (
            <IncomeRow
              key={
                income.id
              }
              income={
                income
              }
              columns={
                tableColumns
              }
              onEdit={
                handleOpenIncomeEdit
              }
              onDelete={
                handleOpenDeleteIncome
              }
            />
          )}
        />
      </FinancialSection>

      {/*=======================================================
        Income Form Modal
      =======================================================*/}
      <IncomeFormModal
        mode={
          incomeFormMode
        }
        income={
          selectedIncome
        }
        isOpen={
          isIncomeFormOpen
        }
        onClose={
          handleCloseIncomeForm
        }
        onSubmit={
          handleIncomeSubmit
        }
        accounts={
          accounts
        }
        accountsLoading={
          accountsLoading
        }
        accountsError={
          accountsError
        }
        submitting={
          submittingIncome
        }
        monthLabel={
          monthLabel
        }
      />

      {/*=======================================================
        Delete Income Confirmation
      =======================================================*/}
      <AppConfirmDialog
        isOpen={
          Boolean(
            deleteIncomeTarget
          )
        }
        onClose={
          handleCloseDeleteIncome
        }
        onConfirm={
          handleDeleteIncome
        }
        eyebrow={
          deleteIncomeTarget
            ? monthLabel
            : undefined
        }
        title="Delete income?"
        description={
          deleteIncomeTarget
            ? `Delete "${deleteIncomeTarget.source}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete income"
        cancelText="Cancel"
        variant="danger"
        loading={
          deletingIncome
        }
        loadingText="Deleting..."
      />
    </>
  );
};

export default BudgetIncomeSection;