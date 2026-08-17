import React, {
  useMemo,
} from 'react';

import {
  AppConfirmDialog,
} from '@/components/ui';

import {
  createFinancialColumns,
} from '@/features/budget/utils/layout';

import {
  BillEmptyState,
  BillErrorState,
  BillLoadingState,
  BillRow,
  BillSectionHeader,
  BillSummary,
} from './components';

import {
  FinancialTableHeader,
} from '@/features/budget/components';

import {
  BillFormModal,
} from './forms';

import {
  BillPaymentModal,
} from './payments';

import {
  useBillDelete,
  useBillFormActions,
  useBillPayment,
  useBillsData,
  useBillSummary,
  usePaymentAccounts,
} from './hooks';

/*===========================================================
  BudgetBillsSection:
  => Displays and manages bills for one budget month.

  Uses:
  => Focused hooks for bill business logic.
  => Reusable Bills UI components.
  => Shared financial column definitions.

  Supports:
  => Create bill.
  => Edit unpaid bill.
  => View paid bill.
  => Mark unpaid bill paid.
  => Reverse a payment.
  => Delete unpaid bill.
  => Create Fixed Expense categories inline.

  Financial Layout:
  => Bill | Amount | Remaining | Actions

  IMPORTANT:
  => BillRow receives the shared column definitions.
  => BillRow will be migrated to FinancialTableRow next.
===========================================================*/
const BudgetBillsSection = ({
  budgetMonthId,
  categories = [],
  month,
  year,
  monthLabel,
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Bill Data
  ===========================================================*/
  const {
    bills,
    loading,
    error,
    loadBills,
  } = useBillsData({
    month,
    year,
  });

  /*===========================================================
    Bill Summary
  ===========================================================*/
  const summary =
    useBillSummary(
      bills
    );

  /*===========================================================
    Payment Accounts
  ===========================================================*/
  const {
    accounts,
    accountsLoading,
    accountsError,
    loadAccounts,
  } = usePaymentAccounts();

  /*===========================================================
    Bill Form
  ===========================================================*/
  const {
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
  } = useBillFormActions({
    budgetMonthId,
    categories,
    loadBills,
    onBudgetMonthChanged,
  });

  /*===========================================================
    Bill Payment
  ===========================================================*/
  const {
    isPaymentModalOpen,
    paymentBill,
    paymentSubmitting,
    reversingPayment,

    handleOpenPaymentModal,
    handleClosePaymentModal,
    handleMarkBillPaid,

    handleMarkBillUnpaid:
    reverseBillPayment,
  } = useBillPayment({
    accounts,
    loadAccounts,
    loadBills,
    onBudgetMonthChanged,
  });

  /*===========================================================
    Bill Delete
  ===========================================================*/
  const {
    deleteBillTarget,
    deletingBill,

    handleOpenDeleteBill,
    handleCloseDeleteBill,
    handleDeleteBill,
  } = useBillDelete({
    loadBills,
    onBudgetMonthChanged,
  });

  /*===========================================================
    Financial Table Columns:
    => Bill description takes all remaining space.
    => Amount, Remaining, and Actions use the same
       fixed financial column width.

    Layout:
    => 1fr | 160px | 160px 
  ===========================================================*/
  const tableColumns =
    useMemo(
      () =>
        createFinancialColumns([
          {
            key: 'bill',
            label: 'Description',
          },
          {
            key: 'amount',
            label: 'Amount',
          },
          {
            key: 'remaining',
            label: 'Remaining',
          },
        ]),
      []
    );

  /*===========================================================
    handleMarkBillUnpaid:
    => Payment hook handles API/business logic.
    => This section controls its own Bill Details modal.

    => Bill Details closes only after a successful reversal.
  ===========================================================*/
  const handleMarkBillUnpaid =
    async () => {
      const success =
        await reverseBillPayment(
          selectedBill
        );

      if (!success) {
        return;
      }

      closeBillFormAfterAction();
    };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Section Header
      =======================================================*/}
      <BillSectionHeader
        monthLabel={
          monthLabel
        }
        onAddBill={
          handleOpenCreateBillForm
        }
      />

      {/*=======================================================
        Financial Table Header
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length > 0 && (
          <FinancialTableHeader
            columns={
              tableColumns
            }
          />
        )}

      {/*=======================================================
        Loading State
      =======================================================*/}
      {loading && (
        <BillLoadingState />
      )}

      {/*=======================================================
        Error State
      =======================================================*/}
      {!loading &&
        error && (
          <BillErrorState
            error={
              error
            }
            onRetry={
              loadBills
            }
          />
        )}

      {/*=======================================================
        Empty State
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length === 0 && (
          <BillEmptyState />
        )}

      {/*=======================================================
        Bill Rows
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length > 0 && (
          <>
            <div className="divide-y divide-[var(--app-border)]">
              {bills.map(
                (
                  bill
                ) => (
                  <BillRow
                    key={
                      bill.id
                    }
                    bill={
                      bill
                    }
                    columns={
                      tableColumns
                    }
                    onOpen={
                      handleOpenBillModal
                    }
                    onMarkPaid={
                      handleOpenPaymentModal
                    }
                    onDelete={
                      handleOpenDeleteBill
                    }
                  />
                )
              )}
            </div>

            {/*=================================================
              Bill Summary
            =================================================*/}
            <BillSummary
              summary={
                summary
              }
            />
          </>
        )}

      {/*=======================================================
        Bill Form Modal
      =======================================================*/}
      <BillFormModal
        mode={
          billModalMode
        }
        isOpen={
          isBillFormOpen
        }
        onClose={
          handleCloseBillForm
        }
        onSubmit={
          handleBillSubmit
        }
        onCreateCategory={
          handleCreateCategory
        }
        onMarkUnpaid={
          handleMarkBillUnpaid
        }
        categories={
          availableCategories
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
        bill={
          selectedBill
        }
        submitting={
          submitting
        }
        reversingPayment={
          reversingPayment
        }
      />

      {/*=======================================================
        Payment Modal
      =======================================================*/}
      <BillPaymentModal
        isOpen={
          isPaymentModalOpen
        }
        onClose={
          handleClosePaymentModal
        }
        onSubmit={
          handleMarkBillPaid
        }
        bill={
          paymentBill
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
          paymentSubmitting
        }
      />

      {/*=======================================================
        Delete Confirmation
      =======================================================*/}
      <AppConfirmDialog
        isOpen={
          Boolean(
            deleteBillTarget
          )
        }
        onClose={
          handleCloseDeleteBill
        }
        onConfirm={
          handleDeleteBill
        }
        eyebrow={
          deleteBillTarget
            ? monthLabel
            : undefined
        }
        title="Delete bill?"
        description={
          deleteBillTarget
            ? `Delete "${deleteBillTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete bill"
        cancelText="Cancel"
        variant="danger"
        loading={
          deletingBill
        }
        loadingText="Deleting..."
      />
    </section>
  );
};

export default BudgetBillsSection;