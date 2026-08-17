import React, {
  useMemo,
} from 'react';

import {
  AppButton,
  AppConfirmDialog,
} from '@/components/ui';

import {
  PlusIcon,
  ReceiptIcon,
} from '@/components/icons/Icons';

import {
  FinancialRows,
  FinancialSection,
} from '@/features/budget/components';

import {
  createFinancialColumns,
} from '@/features/budget/utils/layout';

import {
  BillEmptyState,
  BillErrorState,
  BillLoadingState,
  BillRow,
  BillSummary,
} from './components';

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
  => FinancialSection for shared section/card layout.
  => FinancialRows for shared row-list rendering.
  => FinancialTableRow through BillRow.
  => Focused hooks for Bills business logic.

  Supports:
  => Create bill.
  => Edit unpaid bill.
  => View paid bill.
  => Mark unpaid bill paid.
  => Reverse a payment.
  => Delete unpaid bill.
  => Create Fixed Expense categories inline.

  Layout:
  => Description | Amount | Remaining

  IMPORTANT:
  => Bill actions are NOT a separate table column.
  => Actions appear underneath Remaining when an unpaid
     bill row is hovered or keyboard-focused.
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
    => Description uses all remaining space.
    => Amount uses shared fixed financial width.
    => Remaining uses shared fixed financial width.

    Layout:
    => 1fr | 160px | 160px
  ===========================================================*/
  const tableColumns =
    useMemo(
      () =>
        createFinancialColumns([
          {
            key: 'description',
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
    => Bills section handles Bill Details modal behavior.

    => Details modal closes only after a successful reversal.
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

  /*===========================================================
    Section Actions:
    => Add Bill button.
    => Bills icon.
  ===========================================================*/
  const sectionActions = (
    <>
      <AppButton
        variant="primary"
        onClick={
          handleOpenCreateBillForm
        }
      >
        <PlusIcon className="h-4 w-4" />

        <span>
          Add bill
        </span>
      </AppButton>

      <div className="hidden rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 sm:block">
        <ReceiptIcon className="h-5 w-5" />
      </div>
    </>
  );

  return (
    <FinancialSection
      title="Bills"
      subtitle={`Fixed expense obligations for ${monthLabel}`}
      actions={
        sectionActions
      }
      columns={
        !loading &&
          !error &&
          bills.length > 0
          ? tableColumns
          : []
      }
    >
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
        Empty State / Bill Rows
      =======================================================*/}
      {!loading &&
        !error && (
          <FinancialRows
            items={
              bills
            }
            emptyState={
              <BillEmptyState />
            }
            renderRow={(
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
            )}
          />
        )}

      {/*=======================================================
        Bill Summary
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length > 0 && (
          <BillSummary
            summary={
              summary
            }
          />
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
    </FinancialSection>
  );
};

export default BudgetBillsSection;