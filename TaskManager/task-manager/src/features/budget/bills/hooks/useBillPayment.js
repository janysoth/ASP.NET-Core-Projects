import {
  useCallback,
  useState,
} from 'react';

import {
  markBillPaid,
  markBillUnpaid,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useBillPayment:
  => Owns bill payment and payment-reversal workflows.

  Handles:
  => Payment modal state.
  => Selected bill for payment.
  => Marking a bill paid.
  => Marking a bill unpaid.
  => Loading payment accounts when needed.
  => Refreshing bills and parent budget data.

  IMPORTANT:
  => This hook does NOT control the Bill Details modal.
  => UI components decide what should close after success.
===========================================================*/
export const useBillPayment = ({
  accounts = [],
  loadAccounts,
  loadBills,
  onBudgetMonthChanged,
}) => {
  /*===========================================================
    Payment modal state
  ===========================================================*/
  const [
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  ] = useState(false);

  const [
    paymentBill,
    setPaymentBill,
  ] = useState(null);

  const [
    paymentSubmitting,
    setPaymentSubmitting,
  ] = useState(false);

  /*===========================================================
    Payment reversal state
  ===========================================================*/
  const [
    reversingPayment,
    setReversingPayment,
  ] = useState(false);

  /*===========================================================
    refreshParentBudgetMonth:
    => Refreshes totals, categories, income, and expenses
       on the parent Budget Month page.
  ===========================================================*/
  const refreshParentBudgetMonth =
    useCallback(async () => {
      if (
        onBudgetMonthChanged
      ) {
        await onBudgetMonthChanged();
      }
    }, [
      onBudgetMonthChanged,
    ]);

  /*===========================================================
    handleOpenPaymentModal:
    => Opens payment workflow for an unpaid bill.
    => Loads accounts if they have not been loaded yet.
  ===========================================================*/
  const handleOpenPaymentModal =
    useCallback(
      async (
        bill
      ) => {
        if (
          !bill ||
          bill.isPaid
        ) {
          return;
        }

        setPaymentBill(
          bill
        );

        setIsPaymentModalOpen(
          true
        );

        if (
          accounts.length === 0 &&
          loadAccounts
        ) {
          await loadAccounts();
        }
      },
      [
        accounts.length,
        loadAccounts,
      ]
    );

  /*===========================================================
    handleClosePaymentModal:
    => Prevents closing while payment is being submitted.
  ===========================================================*/
  const handleClosePaymentModal =
    useCallback(() => {
      if (
        paymentSubmitting
      ) {
        return;
      }

      setIsPaymentModalOpen(
        false
      );

      setPaymentBill(
        null
      );
    }, [
      paymentSubmitting,
    ]);

  /*===========================================================
    handleMarkBillPaid:
    => Marks paymentBill as paid.
    => Backend creates the linked ExpenseRecord.

    Returns:
    => true  when successful.
    => false when validation/request fails.
  ===========================================================*/
  const handleMarkBillPaid =
    useCallback(
      async (
        paymentData
      ) => {
        if (
          !paymentBill?.id
        ) {
          showError(
            'Bill ID is required.'
          );

          return false;
        }

        if (
          paymentBill.isPaid
        ) {
          showError(
            'This bill has already been paid.'
          );

          return false;
        }

        try {
          setPaymentSubmitting(
            true
          );

          await markBillPaid(
            paymentBill.id,
            paymentData
          );

          if (loadBills) {
            await loadBills();
          }

          await refreshParentBudgetMonth();

          setIsPaymentModalOpen(
            false
          );

          setPaymentBill(
            null
          );

          showSuccess(
            'Bill marked paid successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              'Unable to mark bill paid.'
            )
          );

          return false;
        } finally {
          setPaymentSubmitting(
            false
          );
        }
      },
      [
        paymentBill,
        loadBills,
        refreshParentBudgetMonth,
      ]
    );

  /*===========================================================
    handleMarkBillUnpaid:
    => Reverses payment for the bill passed to this function.
    => Backend deletes its linked ExpenseRecord.

    IMPORTANT:
    => The bill is passed directly into this function.
    => The hook does not depend on selectedBill from another
       modal or hook.

    Returns:
    => true  when successful.
    => false when validation/request fails.
  ===========================================================*/
  const handleMarkBillUnpaid =
    useCallback(
      async (
        bill
      ) => {
        if (
          !bill?.id
        ) {
          showError(
            'Bill ID is required.'
          );

          return false;
        }

        if (
          !bill.isPaid
        ) {
          showError(
            'This bill is already unpaid.'
          );

          return false;
        }

        try {
          setReversingPayment(
            true
          );

          await markBillUnpaid(
            bill.id
          );

          if (loadBills) {
            await loadBills();
          }

          await refreshParentBudgetMonth();

          showSuccess(
            'Bill marked unpaid successfully.'
          );

          return true;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              'Unable to mark bill unpaid.'
            )
          );

          return false;
        } finally {
          setReversingPayment(
            false
          );
        }
      },
      [
        loadBills,
        refreshParentBudgetMonth,
      ]
    );

  return {
    /*---------------------------------------------------------
      Payment modal
    ---------------------------------------------------------*/
    isPaymentModalOpen,
    paymentBill,
    paymentSubmitting,

    handleOpenPaymentModal,
    handleClosePaymentModal,
    handleMarkBillPaid,

    /*---------------------------------------------------------
      Payment reversal
    ---------------------------------------------------------*/
    reversingPayment,
    handleMarkBillUnpaid,
  };
};