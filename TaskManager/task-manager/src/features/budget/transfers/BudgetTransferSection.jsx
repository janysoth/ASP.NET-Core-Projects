import React, {
  useEffect,
  useMemo,
} from 'react';

import {
  PlusIcon,
  TransactionIcon,
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
  getBudgetMonthDateRangeFromLabel,
} from '@/features/budget/utils/budgetDateUtils';

import {
  TransferEmptyState,
  TransferRow,
  TransferSummary,
} from './components';

import TransferFormModal from './forms/TransferFormModal';

import {
  useTransferAccounts,
  useTransferDelete,
  useTransferForm,
  useTransfers,
} from './hooks';

/*===========================================================
  BudgetTransferSection:
  => Displays and manages Account Transfers.

  Supports:
  => Load Transfers.
  => Filter Transfers by Budget Month.
  => Create Transfer.
  => Edit Transfer.
  => Delete Transfer.
  => Transfer Summary.

  IMPORTANT:
  => Transfers move money between accounts.
  => They are not Income or Expenses.
===========================================================*/
const BudgetTransferSection = ({
  monthLabel = '',

  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Table Columns
  ===========================================================*/
  const tableColumns =
    useMemo(
      () =>
        createFinancialColumns([
          {
            key: 'transfer',
            label: 'Transfer',
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
  } = useTransferAccounts();

  /*===========================================================
    Transfers
  ===========================================================*/
  const {
    transfers,
    transfersLoading,
    transfersError,
    loadTransfers,
  } = useTransfers();

  /*===========================================================
    Transfer Form Workflow
  ===========================================================*/
  const {
    isTransferFormOpen,
    selectedTransfer,
    transferFormMode,
    submittingTransfer,

    handleOpenCreateTransfer,
    handleOpenEditTransfer,
    handleCloseTransferForm,
    handleTransferSubmit,
  } = useTransferForm({
    onBudgetMonthChanged:
      async () => {
        await loadTransfers();

        await onBudgetMonthChanged?.();
      },
  });

  /*===========================================================
    Delete Workflow
  ===========================================================*/
  const {
    deleteTransferTarget,
    deletingTransfer,

    handleOpenDeleteTransfer,
    handleCloseDeleteTransfer,
    handleDeleteTransfer,
  } = useTransferDelete({
    onBudgetMonthChanged:
      async () => {
        await loadTransfers();

        await onBudgetMonthChanged?.();
      },
  });

  /*===========================================================
    Initial Load
  ===========================================================*/
  useEffect(() => {
    loadTransfers();
    loadAccounts();
  }, [
    loadTransfers,
    loadAccounts,
  ]);

  /*===========================================================
    Budget Month Range
  ===========================================================*/
  const {
    minDate,
    maxDate,
  } = useMemo(
    () =>
      getBudgetMonthDateRangeFromLabel(
        monthLabel
      ),
    [
      monthLabel,
    ]
  );

  /*===========================================================
    Transfers For Selected Budget Month
  ===========================================================*/
  const monthTransfers =
    useMemo(
      () => {
        if (
          !minDate ||
          !maxDate
        ) {
          return [];
        }

        return transfers.filter(
          (
            transfer
          ) => {
            const transferDate =
              transfer?.transferDate
                ? String(
                  transfer.transferDate
                ).slice(
                  0,
                  10
                )
                : '';

            return (
              transferDate >=
              minDate &&
              transferDate <=
              maxDate
            );
          }
        );
      },
      [
        transfers,
        minDate,
        maxDate,
      ]
    );

  /*===========================================================
    Open Create Transfer
  ===========================================================*/
  const handleOpenCreate =
    async () => {
      if (
        accounts.length ===
        0
      ) {
        await loadAccounts();
      }

      handleOpenCreateTransfer();
    };

  /*===========================================================
    Open Edit Transfer
  ===========================================================*/
  const handleOpenEdit =
    async (
      transfer
    ) => {
      if (
        accounts.length ===
        0
      ) {
        await loadAccounts();
      }

      handleOpenEditTransfer(
        transfer
      );
    };

  /*===========================================================
    Header Actions
  ===========================================================*/
  const sectionActions = (
    <>
      <AppButton
        variant="primary"
        onClick={
          handleOpenCreate
        }
      >
        <PlusIcon className="h-4 w-4" />

        <span>
          Create transfer
        </span>
      </AppButton>

      <div className="hidden rounded-xl bg-[var(--app-primary)]/10 p-2.5 text-[var(--app-primary)] sm:block">
        <TransactionIcon className="h-5 w-5" />
      </div>
    </>
  );

  return (
    <>
      {/*=======================================================
        Transfer Section
      =======================================================*/}
      <FinancialSection
        title="Transfers"
        subtitle={
          `Account transfers recorded in ${monthLabel}`
        }
        actions={
          sectionActions
        }
        columns={
          monthTransfers.length >
            0
            ? tableColumns
            : []
        }
      >
        {/*=====================================================
          Loading
        =====================================================*/}
        {transfersLoading && (
          <div className="px-5 py-8 text-center text-sm text-[var(--app-text-muted)]">
            Loading transfers...
          </div>
        )}

        {/*=====================================================
          Error
        =====================================================*/}
        {!transfersLoading &&
          transfersError && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {transfersError}
              </p>

              <AppButton
                variant="secondary"
                onClick={
                  loadTransfers
                }
                className="mt-4"
              >
                Try again
              </AppButton>
            </div>
          )}

        {/*=====================================================
          Rows
        =====================================================*/}
        {!transfersLoading &&
          !transfersError && (
            <FinancialRows
              items={
                monthTransfers
              }
              emptyState={
                <TransferEmptyState />
              }
              renderRow={(
                transfer
              ) => (
                <TransferRow
                  key={
                    transfer.id
                  }
                  transfer={
                    transfer
                  }
                  accounts={
                    accounts
                  }
                  onEdit={
                    handleOpenEdit
                  }
                  onDelete={
                    handleOpenDeleteTransfer
                  }
                />
              )}
            />
          )}

        {/*=====================================================
          Summary
        =====================================================*/}
        {!transfersLoading &&
          !transfersError &&
          monthTransfers.length >
          0 && (
            <TransferSummary
              transfers={
                monthTransfers
              }
            />
          )}
      </FinancialSection>

      {/*=======================================================
        Transfer Form Modal
      =======================================================*/}
      <TransferFormModal
        mode={
          transferFormMode
        }
        transfer={
          selectedTransfer
        }
        isOpen={
          isTransferFormOpen
        }
        onClose={
          handleCloseTransferForm
        }
        onSubmit={
          handleTransferSubmit
        }
        accounts={
          accounts
        }
        monthLabel={
          monthLabel
        }
        submitting={
          submittingTransfer
        }
      />

      {/*=======================================================
        Account Load Error
      =======================================================*/}
      {accountsError &&
        isTransferFormOpen && (
          <div className="sr-only">
            {accountsError}
          </div>
        )}

      {/*=======================================================
        Delete Confirmation
      =======================================================*/}
      <AppConfirmDialog
        isOpen={
          Boolean(
            deleteTransferTarget
          )
        }
        onClose={
          handleCloseDeleteTransfer
        }
        onConfirm={
          handleDeleteTransfer
        }
        eyebrow={
          deleteTransferTarget
            ? monthLabel
            : undefined
        }
        title="Delete transfer?"
        description={
          deleteTransferTarget
            ? 'Delete this account transfer? Account balances will automatically recalculate. This action cannot be undone.'
            : ''
        }
        confirmText="Delete transfer"
        cancelText="Cancel"
        variant="danger"
        loading={
          deletingTransfer
        }
        loadingText="Deleting..."
      />
    </>
  );
};

export default BudgetTransferSection;