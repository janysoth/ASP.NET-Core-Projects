import React from 'react';

import {
  useBillDelete,
  useBillFormActions,
  useBillPayment,
  useBillsData,
  useBillSummary,
  usePaymentAccounts,
} from './hooks';

import {
  AppConfirmDialog,
} from '@/components/ui';

import BillEmptyState from './components/BillEmptyState';
import BillErrorState from './components/BillErrorState';
import BillLoadingState from './components/BillLoadingState';
import BillRow from './components/BillRow';
import BillSectionHeader from './components/BillSectionHeader';
import BillSummary from './components/BillSummary';

import BillFormModal from './forms/BillFormModal';

import BillPaymentModal from './payments/BillPaymentModal';

/*===========================================================
  BudgetBillsSection:
  => Displays and manages bills for one budget month.

  Supports:
  => Create bill.
  => Edit unpaid bill.
  => View paid bill.
  => Mark unpaid bill paid.
  => Reverse a payment.
  => Delete unpaid bill.
  => Create Fixed Expense categories inline.
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
    Bill data
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
    Bill Form Actions
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
    Delete Bill States
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
    Payment Accounts
    => Loads accounts that may be used for bill payments.
  ===========================================================*/
  const {
    accounts,
    accountsLoading,
    accountsError,
    loadAccounts,
  } = usePaymentAccounts();

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
  handleMarkBillUnpaid:
  => Asks the payment hook to reverse the selected bill.
  => Closes Bill Details only after a successful reversal.

  IMPORTANT:
  => useBillPayment handles business/API logic.
  => BudgetBillsSection handles UI/modal behavior.
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
    Bill summary
  ===========================================================*/
  const summary =
    useBillSummary(
      bills
    );

  return (
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      {/*=======================================================
        Bill Section Header
      =======================================================*/}
      <BillSectionHeader
        monthLabel={monthLabel}
        onAddBill={handleOpenCreateBillForm}
      />

      {/*=======================================================
        Loading
      =======================================================*/}
      {loading && (
        <BillLoadingState />
      )}

      {/*=======================================================
        Error
      =======================================================*/}
      {!loading &&
        error && (
          <BillErrorState
            error={error}
            onRetry={loadBills}
          />
        )}

      {/*=======================================================
        Empty state
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length === 0 && (
          <BillEmptyState />
        )}

      {/*=======================================================
        Bills
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length >
        0 && (
          <>
            <div className="divide-y divide-[var(--app-border)]">
              {bills.map(
                (bill) => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
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
              Summary
            =================================================*/}
            <BillSummary
              summary={summary}
            />
          </>
        )}

      {/*=======================================================
        Bill form
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
        Payment modal
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
        Delete confirmation
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