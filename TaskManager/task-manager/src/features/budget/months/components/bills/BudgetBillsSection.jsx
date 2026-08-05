import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarIcon,
  PlusIcon,
  ReceiptIcon,
} from '@/components/icons/Icons';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

import {
  createBill,
  createBudgetCategory,
  getBills,
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


/*===========================================================
  BudgetBillsSection:
  => Loads and displays bills for one budget month.
  => Creates missing Fixed Expense categories.
  => Creates and updates unpaid bills.
  => Opens paid bills in details mode.
  => Reverses paid bills using Mark Unpaid.
===========================================================*/
const BudgetBillsSection = ({
  budgetMonthId,
  categories = [],
  month,
  year,
  monthLabel,
  onBudgetMonthChanged,
}) => {
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
    Synchronize categories:
    => Keeps the section's local category list synchronized
       with the refreshed budget month.
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
    => Loads bills for the selected month and year.
    => Sorts unpaid bills before paid bills.
    => Sorts each group by due date.
  ===========================================================*/
  const loadBills =
    useCallback(async () => {
      if (!month || !year) {
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
      } catch (requestError) {
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
    Initial bill load:
    => Reloads whenever the selected month or year changes.
  ===========================================================*/
  useEffect(() => {
    loadBills();
  }, [
    loadBills,
  ]);

  /*===========================================================
    Bill summary:
    => Calculates bill counts and monetary totals.
  ===========================================================*/
  const summary =
    useMemo(() => {
      const paidBills =
        bills.filter(
          (bill) =>
            bill.isPaid
        );

      const unpaidBills =
        bills.filter(
          (bill) =>
            !bill.isPaid
        );

      const expectedTotal =
        bills.reduce(
          (
            total,
            bill
          ) =>
            total +
            Number(
              bill.expectedAmount ?? 0
            ),
          0
        );

      const remainingTotal =
        unpaidBills.reduce(
          (
            total,
            bill
          ) =>
            total +
            Number(
              bill.remainingAmount ??
              bill.expectedAmount ??
              0
            ),
          0
        );

      return {
        totalBills:
          bills.length,

        paidBills:
          paidBills.length,

        unpaidBills:
          unpaidBills.length,

        expectedTotal,

        remainingTotal,
      };
    }, [
      bills,
    ]);

  /*===========================================================
    handleOpenCreateBillForm:
    => Opens an empty modal in create mode.
  ===========================================================*/
  const handleOpenCreateBillForm = () => {
    setSelectedBill(null);
    setBillModalMode('create');
    setIsBillFormOpen(true);
  };

  /*===========================================================
    handleOpenBillModal:
    => Opens an unpaid bill in edit mode.
    => Opens a paid bill in details mode.
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

    setIsBillFormOpen(true);
  };

  /*===========================================================
    handleCloseBillForm:
    => Closes the bill modal.
    => Prevents closing while saving or reversing payment.
    => Resets the selected bill and modal mode.
  ===========================================================*/
  const handleCloseBillForm = () => {
    if (
      submitting ||
      reversingPayment
    ) {
      return;
    }

    setIsBillFormOpen(false);
    setSelectedBill(null);
    setBillModalMode('create');
  };

  /*===========================================================
    handleCreateCategory:
    => Creates a Fixed Expense category with PlannedAmount 0.
    => Adds the returned category to the local dropdown.
    => Returns the category to BillFormModal so it can be
       selected automatically.
  ===========================================================*/
  const handleCreateCategory = async (
    categoryData
  ) => {
    try {
      const createdCategory =
        await createBudgetCategory(
          budgetMonthId,
          categoryData
        );

      setAvailableCategories(
        (currentCategories) => {
          const alreadyExists =
            currentCategories.some(
              (category) =>
                category.id ===
                createdCategory.id
            );

          if (alreadyExists) {
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
    } catch (requestError) {
      const message =
        getApiErrorMessage(
          requestError,
          'Unable to create category.'
        );

      /*
        BillFormModal catches this error and displays the
        message inside the nested category modal.
      */
      throw new Error(
        message
      );
    }
  };

  /*===========================================================
    handleBillSubmit:
    => Creates a bill in create mode.
    => Updates a bill in edit mode.
    => Reloads bills and monthly budget totals.
  ===========================================================*/
  const handleBillSubmit = async (
    formData
  ) => {
    try {
      setSubmitting(true);

      const isUpdating =
        billModalMode === 'edit' &&
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

      if (onBudgetMonthChanged) {
        await onBudgetMonthChanged();
      }

      setIsBillFormOpen(false);
      setSelectedBill(null);
      setBillModalMode('create');

      showSuccess(
        isUpdating
          ? 'Bill updated successfully.'
          : 'Bill created successfully.'
      );
    } catch (requestError) {
      showError(
        getApiErrorMessage(
          requestError,
          billModalMode === 'edit'
            ? 'Unable to update bill.'
            : 'Unable to create bill.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*===========================================================
    handleMarkBillUnpaid:
    => Reverses the selected bill's payment.
    => Deletes the linked ExpenseRecord through the backend.
    => Reloads bills and monthly budget totals.
  ===========================================================*/
  const handleMarkBillUnpaid = async () => {
    if (!selectedBill?.id) {
      showError(
        'Bill ID is required.'
      );

      return;
    }

    if (!selectedBill.isPaid) {
      showError(
        'This bill is already unpaid.'
      );

      return;
    }

    try {
      setReversingPayment(true);

      await markBillUnpaid(
        selectedBill.id
      );

      await loadBills();

      if (onBudgetMonthChanged) {
        await onBudgetMonthChanged();
      }

      setIsBillFormOpen(false);
      setSelectedBill(null);
      setBillModalMode('create');

      showSuccess(
        'Bill marked unpaid successfully.'
      );
    } catch (requestError) {
      showError(
        getApiErrorMessage(
          requestError,
          'Unable to mark bill unpaid.'
        )
      );
    } finally {
      setReversingPayment(false);
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
            Fixed expense obligations for {monthLabel}
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
        Loading state
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
        Error state
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
                onClick={loadBills}
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
        bills.length === 0 && (
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
        Bill rows
      =======================================================*/}
      {!loading &&
        !error &&
        bills.length > 0 && (
          <>
            <div className="divide-y divide-[var(--app-border)]">
              {bills.map(
                (bill) => {
                  const statusAppearance =
                    getBillStatusAppearance(
                      bill
                    );

                  return (
                    <button
                      key={bill.id}
                      type="button"
                      onClick={() =>
                        handleOpenBillModal(
                          bill
                        )
                      }
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--app-surface-muted)]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        <CalendarIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                            {bill.name}
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusAppearance.className}`}
                          >
                            {statusAppearance.label}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
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

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-[var(--app-text)]">
                          {formatCurrency(
                            bill.expectedAmount
                          )}
                        </p>

                        {!bill.isPaid && (
                          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                            {formatCurrency(
                              bill.remainingAmount ??
                              bill.expectedAmount
                            )}{' '}
                            remaining
                          </p>
                        )}

                        {bill.isPaid && (
                          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                            Paid{' '}
                            {bill.paidDate
                              ? formatUtcDate(
                                bill.paidDate
                              )
                              : ''}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/*=================================================
              Bill summary
            =================================================*/}
            <div className="grid grid-cols-2 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 sm:grid-cols-5">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Total
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {summary.totalBills}
                </p>
              </div>

              <div className="border-l border-[var(--app-border)] px-4 py-3 text-center">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Paid
                </p>

                <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.paidBills}
                </p>
              </div>

              <div className="border-t border-[var(--app-border)] px-4 py-3 text-center sm:border-l sm:border-t-0">
                <p className="text-xs text-[var(--app-text-muted)]">
                  Unpaid
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                  {summary.unpaidBills}
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
        Create, edit, and details modal
      =======================================================*/}
      <BillFormModal
        mode={billModalMode}
        isOpen={isBillFormOpen}
        onClose={handleCloseBillForm}
        onSubmit={handleBillSubmit}
        onCreateCategory={handleCreateCategory}
        onMarkUnpaid={handleMarkBillUnpaid}
        categories={availableCategories}
        month={month}
        year={year}
        monthLabel={monthLabel}
        bill={selectedBill}
        submitting={submitting}
        reversingPayment={reversingPayment}
      />
    </section>
  );
};

export default BudgetBillsSection;