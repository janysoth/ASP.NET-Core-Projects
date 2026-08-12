import {
  useCallback,
  useState,
} from 'react';

import {
  deleteBill,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useBillDelete:
  => Owns the delete workflow for unpaid bills.

  Handles:
  => Selected bill for deletion.
  => Delete confirmation state.
  => Loading state.
  => Backend delete request.
  => Refreshing bills and parent budget month.
===========================================================*/
export const useBillDelete = ({
  loadBills,
  onBudgetMonthChanged,
}) => {
  const [
    deleteBillTarget,
    setDeleteBillTarget,
  ] = useState(null);

  const [
    deletingBill,
    setDeletingBill,
  ] = useState(false);

  /*===========================================================
    refreshParentBudgetMonth:
    => Refreshes the parent budget month after deletion.
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
    handleOpenDeleteBill:
    => Opens confirmation for an unpaid bill.
    => Paid bills must first be marked unpaid.
  ===========================================================*/
  const handleOpenDeleteBill =
    useCallback(
      (
        bill
      ) => {
        if (!bill) {
          return;
        }

        if (
          bill.isPaid
        ) {
          showError(
            'Paid bills cannot be deleted. Mark the bill unpaid first.'
          );

          return;
        }

        setDeleteBillTarget(
          bill
        );
      },
      []
    );

  /*===========================================================
    handleCloseDeleteBill:
    => Prevents closing while deletion is running.
  ===========================================================*/
  const handleCloseDeleteBill =
    useCallback(() => {
      if (
        deletingBill
      ) {
        return;
      }

      setDeleteBillTarget(
        null
      );
    }, [
      deletingBill,
    ]);

  /*===========================================================
    handleDeleteBill:
    => Deletes the selected unpaid bill.
    => Reloads bills.
    => Refreshes parent budget totals/categories.
  ===========================================================*/
  const handleDeleteBill =
    useCallback(
      async () => {
        if (
          !deleteBillTarget?.id
        ) {
          showError(
            'Bill ID is required.'
          );

          return;
        }

        try {
          setDeletingBill(
            true
          );

          await deleteBill(
            deleteBillTarget.id
          );

          await loadBills();

          await refreshParentBudgetMonth();

          setDeleteBillTarget(
            null
          );

          showSuccess(
            'Bill deleted successfully.'
          );
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              'Unable to delete bill.'
            )
          );
        } finally {
          setDeletingBill(
            false
          );
        }
      },
      [
        deleteBillTarget,
        loadBills,
        refreshParentBudgetMonth,
      ]
    );

  return {
    deleteBillTarget,
    deletingBill,

    handleOpenDeleteBill,
    handleCloseDeleteBill,
    handleDeleteBill,
  };
};