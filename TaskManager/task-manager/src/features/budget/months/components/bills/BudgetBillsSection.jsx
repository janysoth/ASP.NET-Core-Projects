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

import {
  PlusIcon,
  ReceiptIcon,
} from '@/components/icons/Icons';

import BillFormModal from './BillFormModal';
import BillPaymentModal from './BillPaymentModal';
import BillRow from './BillRow';
import BillSummary from './BillSummary';

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
        Header
      =======================================================*/}
      <div className="flex flex-col gap-4 border-b border-[var(--app-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-[var(--app-text)]">
            Bills
          </h2>

          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Fixed expense obligations for{' '}
            {monthLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={
              handleOpenCreateBillForm
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--app-primary-hover)]"
          >
            <PlusIcon className="h-4 w-4" />

            Add bill
          </button>

          <div className="hidden rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 sm:block">
            <ReceiptIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/*=======================================================
        Loading
      =======================================================*/}
      {loading && (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[var(--app-border)] border-t-[var(--app-primary)]" />

            <p className="mt-3 text-sm text-[var(--app-text-muted)]">
              Loading bills...
            </p>
          </div>
        </div>
      )}

      {/*=======================================================
        Error
      =======================================================*/}
      {!loading &&
        error && (
          <div className="p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Unable to load bills
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>

              <button
                type="button"
                onClick={
                  loadBills
                }
                className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        )}

      {/*=======================================================
        Empty state
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length ===
        0 && (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
              <ReceiptIcon className="h-6 w-6 text-[var(--app-text-muted)]" />
            </div>

            <p className="mt-4 text-sm font-semibold text-[var(--app-text)]">
              No bills found
            </p>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              There are no bills in this budget month.
            </p>
          </div>
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