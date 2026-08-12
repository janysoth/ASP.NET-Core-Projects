import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useBillSummary,
  usePaymentAccounts,
} from './hooks';

import {
  ActionButton,
  AppConfirmDialog,
} from '@/components/ui';

import {
  CalendarIcon,
  PlusIcon,
  ReceiptIcon,
  TrashIcon,
  WalletIcon,
} from '@/components/icons/Icons';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

import {
  createBill,
  createBudgetCategory,
  deleteBill,
  getBills,
  markBillPaid,
  markBillUnpaid,
  updateBill,
} from '@/features/budget/api/budgetApi';

import {
  formatCurrency,
  formatUtcDate,
} from '@/features/budget/utils/budgetFormatters';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  getBillStatusAppearance,
  sortBills,
} from '@/features/budget/utils/billUtils';

import BillFormModal from './BillFormModal';
import BillPaymentModal from './BillPaymentModal';

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
  const [
    bills,
    setBills,
  ] = useState([]);

  const [
    availableCategories,
    setAvailableCategories,
  ] = useState(
    categories
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /*===========================================================
    Bill form modal
  ===========================================================*/
  const [
    isBillFormOpen,
    setIsBillFormOpen,
  ] = useState(false);

  const [
    selectedBill,
    setSelectedBill,
  ] = useState(null);

  const [
    billModalMode,
    setBillModalMode,
  ] = useState('create');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    reversingPayment,
    setReversingPayment,
  ] = useState(false);

  /*===========================================================
    Payment modal
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
    Delete bill
  ===========================================================*/
  const [
    deleteBillTarget,
    setDeleteBillTarget,
  ] = useState(null);

  const [
    deletingBill,
    setDeletingBill,
  ] = useState(false);

  /*===========================================================
    Synchronize categories
  ===========================================================*/
  useEffect(() => {
    setAvailableCategories(
      categories
    );
  }, [
    categories,
  ]);

  /*===========================================================
    loadBills:
    => Loads and sorts bills for the selected budget month.
  ===========================================================*/
  const loadBills =
    useCallback(async () => {
      if (
        !month ||
        !year
      ) {
        setBills([]);
        setLoading(false);

        return [];
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await getBills(
            month,
            year
          );

        const sortedBills =
          sortBills(
            response
          );

        setBills(
          sortedBills
        );

        return sortedBills;
      } catch (
      requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            'Unable to load bills.'
          )
        );

        return [];
      } finally {
        setLoading(false);
      }
    }, [
      month,
      year,
    ]);

  /*===========================================================
    Initial load
  ===========================================================*/
  useEffect(() => {
    loadBills();
  }, [
    loadBills,
  ]);

  /*===========================================================
    loadAccounts:
    => Loads accounts that may be used for bill payments.
  ===========================================================*/
  const {
    accounts,
    accountsLoading,
    accountsError,
    loadAccounts,
  } = usePaymentAccounts();

  /*===========================================================
    Bill summary
  ===========================================================*/
  const summary =
    useBillSummary(
      bills
    );

  /*===========================================================
    Open Create Bill
  ===========================================================*/
  const handleOpenCreateBillForm = () => {
    setSelectedBill(
      null
    );

    setBillModalMode(
      'create'
    );

    setIsBillFormOpen(
      true
    );
  };

  /*===========================================================
    Open Bill:
    => Unpaid = edit.
    => Paid   = details.
  ===========================================================*/
  const handleOpenBillModal = (
    bill
  ) => {
    setSelectedBill(
      bill
    );

    setBillModalMode(
      bill.isPaid
        ? 'details'
        : 'edit'
    );

    setIsBillFormOpen(
      true
    );
  };

  /*===========================================================
    Close Bill Form
  ===========================================================*/
  const handleCloseBillForm = () => {
    if (
      submitting ||
      reversingPayment
    ) {
      return;
    }

    setIsBillFormOpen(
      false
    );

    setSelectedBill(
      null
    );

    setBillModalMode(
      'create'
    );
  };

  /*===========================================================
    Open payment modal
  ===========================================================*/
  const handleOpenPaymentModal =
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
        accounts.length ===
        0
      ) {
        await loadAccounts();
      }
    };

  /*===========================================================
    Close payment modal
  ===========================================================*/
  const handleClosePaymentModal = () => {
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
  };

  /*===========================================================
    Create category
  ===========================================================*/
  const handleCreateCategory =
    async (
      categoryData
    ) => {
      try {
        const createdCategory =
          await createBudgetCategory(
            budgetMonthId,
            categoryData
          );

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

            if (
              alreadyExists
            ) {
              return currentCategories;
            }

            return [
              ...currentCategories,
              createdCategory,
            ];
          }
        );

        showSuccess(
          'Category created successfully.'
        );

        return createdCategory;
      } catch (
      requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            'Unable to create category.'
          );

        throw new Error(
          message
        );
      }
    };

  /*===========================================================
    Create / update bill
  ===========================================================*/
  const handleBillSubmit =
    async (
      formData
    ) => {
      try {
        setSubmitting(
          true
        );

        const isUpdating =
          billModalMode ===
          'edit' &&
          selectedBill?.id;

        if (isUpdating) {
          await updateBill(
            selectedBill.id,
            formData
          );
        } else {
          await createBill(
            budgetMonthId,
            formData
          );
        }

        await loadBills();

        if (
          onBudgetMonthChanged
        ) {
          await onBudgetMonthChanged();
        }

        setIsBillFormOpen(
          false
        );

        setSelectedBill(
          null
        );

        setBillModalMode(
          'create'
        );

        showSuccess(
          isUpdating
            ? 'Bill updated successfully.'
            : 'Bill created successfully.'
        );
      } catch (
      requestError
      ) {
        showError(
          getApiErrorMessage(
            requestError,
            billModalMode ===
              'edit'
              ? 'Unable to update bill.'
              : 'Unable to create bill.'
          )
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /*===========================================================
    Mark Bill Paid
  ===========================================================*/
  const handleMarkBillPaid =
    async (
      paymentData
    ) => {
      if (
        !paymentBill?.id
      ) {
        showError(
          'Bill ID is required.'
        );

        return;
      }

      if (
        paymentBill.isPaid
      ) {
        showError(
          'This bill has already been paid.'
        );

        return;
      }

      try {
        setPaymentSubmitting(
          true
        );

        await markBillPaid(
          paymentBill.id,
          paymentData
        );

        await loadBills();

        if (
          onBudgetMonthChanged
        ) {
          await onBudgetMonthChanged();
        }

        setIsPaymentModalOpen(
          false
        );

        setPaymentBill(
          null
        );

        showSuccess(
          'Bill marked paid successfully.'
        );
      } catch (
      requestError
      ) {
        showError(
          getApiErrorMessage(
            requestError,
            'Unable to mark bill paid.'
          )
        );
      } finally {
        setPaymentSubmitting(
          false
        );
      }
    };

  /*===========================================================
    Mark Bill Unpaid
  ===========================================================*/
  const handleMarkBillUnpaid =
    async () => {
      if (
        !selectedBill?.id
      ) {
        showError(
          'Bill ID is required.'
        );

        return;
      }

      if (
        !selectedBill.isPaid
      ) {
        showError(
          'This bill is already unpaid.'
        );

        return;
      }

      try {
        setReversingPayment(
          true
        );

        await markBillUnpaid(
          selectedBill.id
        );

        await loadBills();

        if (
          onBudgetMonthChanged
        ) {
          await onBudgetMonthChanged();
        }

        setIsBillFormOpen(
          false
        );

        setSelectedBill(
          null
        );

        setBillModalMode(
          'create'
        );

        showSuccess(
          'Bill marked unpaid successfully.'
        );
      } catch (
      requestError
      ) {
        showError(
          getApiErrorMessage(
            requestError,
            'Unable to mark bill unpaid.'
          )
        );
      } finally {
        setReversingPayment(
          false
        );
      }
    };

  /*===========================================================
    Open delete confirmation
  ===========================================================*/
  const handleOpenDeleteBill = (
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
  };

  /*===========================================================
    Close delete confirmation
  ===========================================================*/
  const handleCloseDeleteBill = () => {
    if (
      deletingBill
    ) {
      return;
    }

    setDeleteBillTarget(
      null
    );
  };

  /*===========================================================
    Delete bill
  ===========================================================*/
  const handleDeleteBill =
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

        if (
          onBudgetMonthChanged
        ) {
          await onBudgetMonthChanged();
        }

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
    };

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
                (
                  bill
                ) => {
                  const statusAppearance =
                    getBillStatusAppearance(
                      bill
                    );

                  return (
                    <div
                      key={bill.id}
                      className="
                        group/row 
                        transition-all 
                        duration-200
                        flex
                        w-full
                        items-stretch
                        hover:bg-[var(--app-surface-muted)]
                        focus-within:bg-[var(--app-surface-muted)]
                      "
                    >
                      {/*=========================================================
                        Main bill information:
                        => Takes as much horizontal space as possible.
                        => Remains readable on medium screens.
                      =========================================================*/}
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenBillModal(
                            bill
                          )
                        }
                        className="
                          flex
                          min-w-0
                          flex-1
                          items-center
                          gap-4

                          px-5
                          py-4

                          text-left

                          focus-visible:outline-none"
                      >
                        {/*=======================================================
                          Bill icon
                        =======================================================*/}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          <CalendarIcon className="h-5 w-5" />
                        </div>

                        {/*=======================================================
                          Bill information
                        =======================================================*/}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className="
                                min-w-0
                                text-sm
                                font-semibold
                                text-[var(--app-text)]

                                max-sm:truncate
                              "
                            >
                              {bill.name}
                            </p>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusAppearance.className}`}
                            >
                              {statusAppearance.label}
                            </span>
                          </div>

                          <p
                            className="
                              mt-1
                              text-xs
                              leading-5
                              text-[var(--app-text-muted)]

                              max-sm:truncate
                            "
                          >
                            {bill.budgetCategoryName ||
                              'Unknown category'}

                            {' · '}

                            Due{' '}

                            {formatUtcDate(
                              bill.dueDate,
                              'No due date'
                            )}
                          </p>
                        </div>
                      </button>

                      {/*=========================================================
                        Right side:
                        => Amount is visible normally.
                        => On unpaid-row hover, amount fades out.
                        => Actions fade in and use the same right-side space.
                      =========================================================*/}
                      <div
                        className="
                          ml-auto
                          flex
                          min-w-[185px]
                          shrink-0
                          flex-col
                          items-end
                          justify-center

                          py-4
                          pr-5
                          pl-3
                        "
                      >
                        {/*=======================================================
                          Amount / payment information

                          Unpaid:
                          => Visible normally.
                          => Fades out when row is hovered or keyboard-focused.

                          Paid:
                          => Always visible.
                        =======================================================*/}
                        <div className="text-right">
                          <p className="text-sm font-bold text-[var(--app-text)]">
                            {formatCurrency(
                              bill.expectedAmount
                            )}
                          </p>

                          {!bill.isPaid && (
                            <p className="mt-1 whitespace-nowrap text-xs text-[var(--app-text-muted)]">
                              {formatCurrency(
                                bill.remainingAmount ??
                                bill.expectedAmount
                              )}{' '}
                              remaining
                            </p>
                          )}

                          {bill.isPaid && (
                            <p className="mt-1 whitespace-nowrap text-xs text-emerald-600 dark:text-emerald-400">
                              Paid{' '}
                              {bill.paidDate
                                ? formatUtcDate(
                                  bill.paidDate
                                )
                                : ''}
                            </p>
                          )}
                        </div>

                        {/*=======================================================
                          Unpaid bill actions

                          Mobile:
                          => Icons stay visible because touch devices do not
                            have reliable hover.

                          md+:
                          => Hidden normally.
                          => Entire action group appears when the bill row
                            is hovered or keyboard-focused.

                          Hover individual ActionButton:
                          => Its label expands:
                            Mark Paid
                            Delete
                        =======================================================*/}
                        {!bill.isPaid && (
                          <div
                            className="
                              mt-2

                              flex
                              items-center
                              gap-2

                              max-h-0
                              overflow-hidden

                              opacity-0

                              transition-all
                              duration-200
                              ease-out

                              md:group-hover/row:max-h-12
                              md:group-hover/row:opacity-100

                              md:group-focus-within/row:max-h-12
                              md:group-focus-within/row:opacity-100
                            "
                          >
                            <ActionButton
                              variant="success"
                              size="sm"
                              expandable
                              label="Mark Paid"
                              icon={
                                <WalletIcon className="h-4 w-4" />
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenPaymentModal(
                                  bill
                                );
                              }}
                            />

                            <ActionButton
                              variant="danger"
                              size="sm"
                              expandable
                              label="Delete"
                              icon={
                                <TrashIcon className="h-4 w-4" />
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenDeleteBill(
                                  bill
                                );
                              }}
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  );
                }
              )}
            </div>

            {/*=================================================
              Summary
            =================================================*/}
            <div className="grid grid-cols-2 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 sm:grid-cols-5">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Total
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {
                    summary.totalBills
                  }
                </p>
              </div>

              <div className="border-l border-[var(--app-border)] px-4 py-3 text-center">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Paid
                </p>

                <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {
                    summary.paidBills
                  }
                </p>
              </div>

              <div className="border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-l sm:border-t-0">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Unpaid
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {
                    summary.unpaidBills
                  }
                </p>
              </div>

              <div className="border-l border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-t-0">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Expected
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {formatCurrency(
                    summary.expectedTotal
                  )}
                </p>
              </div>

              <div className="col-span-2 border-t border-[var(--app-border)] px-4 py-3 text-center sm:col-span-1 sm:border-l sm:border-t-0">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Remaining
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {formatCurrency(
                    summary.remainingTotal
                  )}
                </p>
              </div>
            </div>
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