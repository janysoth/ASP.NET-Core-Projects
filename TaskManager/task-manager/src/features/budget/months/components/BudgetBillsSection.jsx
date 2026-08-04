import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import toast from 'react-hot-toast';

import {
  CalendarIcon,
  PlusIcon,
  ReceiptIcon,
} from '../../../../components/icons/Icons';

import {
  createBill,
  createBudgetCategory,
  getBills,
  updateBill,
} from '../../dashboard/api/budgetDashboardApi';

import {
  formatCurrency,
  formatUtcDate,
} from '../../utils/budgetFormatters';

import {
  getApiErrorMessage,
} from '../../utils/budgetErrors';

import {
  getBillStatusAppearance,
  sortBills,
} from '../../utils/billUtils';

import BillFormModal from './BillFormModal';

/*===========================================================
  BudgetBillsSection:
  => Loads bills for one month.
  => Creates missing Fixed Expense categories.
  => Creates new bills.
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
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    selectedBill,
    setSelectedBill,
  ] = useState(null);

  /*===========================================================
    Synchronize categories from the parent budget month.
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
    => Loads and sorts the selected month's bills.
  ===========================================================*/
  const loadBills =
    useCallback(async () => {
      if (!month || !year) {
        setBills([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await getBills(
            month,
            year
          );

        setBills(
          sortBills(
            response
          )
        );
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            'Unable to load bills.'
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      month,
      year,
    ]);

  useEffect(() => {
    loadBills();
  }, [
    loadBills,
  ]);

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
    setIsBillFormOpen(true);
  };

  /*===========================================================
    handleCloseBillForm:
    => Closes the create/edit modal.
    => Clears the selected bill.
  ===========================================================*/
  const handleCloseBillForm = () => {
    if (submitting) {
      return;
    }

    setIsBillFormOpen(false);
    setSelectedBill(null);
  };

  /*===========================================================
    handleCreateCategory:
    => Creates a Fixed Expense category with PlannedAmount 0.
    => Returns the created category to BillFormModal.
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

      toast.success(
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
        BillFormModal displays this message inside the nested
        category modal.
      */
      throw new Error(
        message
      );
    }
  };

  /*===========================================================
  handleOpenEditBillForm:
  => Opens the modal with an existing unpaid bill.
  => Paid bills cannot be edited.
===========================================================*/
  const handleOpenEditBillForm = (
    bill
  ) => {
    if (bill.isPaid) {
      toast(
        'Paid bills cannot be edited. Mark the bill unpaid first.'
      );

      return;
    }

    setSelectedBill(
      bill
    );

    setIsBillFormOpen(true);
  };

  /*===========================================================
    handleBillSubmit:
    => Creates a new bill when selectedBill is null.
    => Updates an existing bill when selectedBill is set.
    => Reloads bills and refreshes the parent budget month.
  ===========================================================*/
  const handleBillSubmit = async (
    formData
  ) => {
    try {
      setSubmitting(true);

      if (selectedBill) {
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

      toast.success(
        selectedBill
          ? 'Bill updated successfully.'
          : 'Bill created successfully.'
      );
    } catch (requestError) {
      toast.error(
        getApiErrorMessage(
          requestError,
          selectedBill
            ? 'Unable to update bill.'
            : 'Unable to create bill.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
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
                className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        )}

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
                        handleOpenEditBillForm(
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

      <BillFormModal
        isOpen={isBillFormOpen}
        onClose={
          handleCloseBillForm
        }
        onSubmit={
          handleBillSubmit
        }
        onCreateCategory={
          handleCreateCategory
        }
        categories={
          availableCategories
        }
        month={month}
        year={year}
        monthLabel={monthLabel}
        bill={selectedBill}
        submitting={submitting}
      />
    </section>
  );
};

export default BudgetBillsSection;