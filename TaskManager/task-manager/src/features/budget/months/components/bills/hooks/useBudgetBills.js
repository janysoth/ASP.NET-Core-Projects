import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

import {
  createBill,
  createBudgetCategory,
  deleteBill,
  getAccounts,
  getBills,
  markBillPaid,
  markBillUnpaid,
  updateBill,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  sortBills,
} from '@/features/budget/utils/billUtils';

/*===========================================================
  useBudgetBills:
  => Owns bill-related state and business interactions for
     one budget month.

  Handles:
  => Loading bills.
  => Loading payment accounts.
  => Create bill.
  => Edit bill.
  => Mark bill paid.
  => Mark bill unpaid.
  => Delete bill.
  => Create Fixed Expense category.
  => Bill form modal state.
  => Payment modal state.
  => Delete confirmation state.
  => Bill summary calculations.

  IMPORTANT:
  => UI rendering remains inside components.
===========================================================*/
export const useBudgetBills = ({
  budgetMonthId,
  categories = [],
  month,
  year,
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
    Payment accounts
  ===========================================================*/
  const [
    accounts,
    setAccounts,
  ] = useState([]);

  const [
    accountsLoading,
    setAccountsLoading,
  ] = useState(false);

  const [
    accountsError,
    setAccountsError,
  ] = useState('');

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
    Synchronize categories:
    => Parent budget refresh may return a new category array.
  ===========================================================*/
  useEffect(() => {
    setAvailableCategories(
      categories
    );
  }, [
    categories,
  ]);

  /*===========================================================
    refreshParentBudgetMonth:
    => Refreshes totals/categories/expenses on the parent page.
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
    loadBills:
    => Loads bills for the current month/year.
    => Sorts bills before storing them.
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
    Initial bill load
  ===========================================================*/
  useEffect(() => {
    loadBills();
  }, [
    loadBills,
  ]);

  /*===========================================================
    loadAccounts:
    => Loads financial accounts that may be used to pay bills.
  ===========================================================*/
  const loadAccounts =
    useCallback(async () => {
      try {
        setAccountsLoading(
          true
        );

        setAccountsError('');

        const response =
          await getAccounts();

        const normalizedAccounts =
          Array.isArray(
            response
          )
            ? response
            : [];

        setAccounts(
          normalizedAccounts
        );

        return normalizedAccounts;
      } catch (
      requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            'Unable to load payment accounts.'
          );

        setAccountsError(
          message
        );

        setAccounts([]);

        return [];
      } finally {
        setAccountsLoading(
          false
        );
      }
    }, []);

  /*===========================================================
    Bill summary
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
              bill.expectedAmount ??
              0
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
    handleOpenCreateBillForm
  ===========================================================*/
  const handleOpenCreateBillForm =
    useCallback(() => {
      setSelectedBill(
        null
      );

      setBillModalMode(
        'create'
      );

      setIsBillFormOpen(
        true
      );
    }, []);

  /*===========================================================
    handleOpenBillModal:
    => Unpaid bill = edit.
    => Paid bill   = details.
  ===========================================================*/
  const handleOpenBillModal =
    useCallback(
      (
        bill
      ) => {
        if (!bill) {
          return;
        }

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
      },
      []
    );

  /*===========================================================
    handleCloseBillForm
  ===========================================================*/
  const handleCloseBillForm =
    useCallback(() => {
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
    }, [
      submitting,
      reversingPayment,
    ]);

  /*===========================================================
    handleOpenPaymentModal
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
          accounts.length ===
          0
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
    handleClosePaymentModal
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
    handleCreateCategory
  ===========================================================*/
  const handleCreateCategory =
    useCallback(
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
      },
      [
        budgetMonthId,
      ]
    );

  /*===========================================================
    handleBillSubmit:
    => Creates or updates a bill.
  ===========================================================*/
  const handleBillSubmit =
    useCallback(
      async (
        formData
      ) => {
        const isUpdating =
          billModalMode ===
          'edit' &&
          Boolean(
            selectedBill?.id
          );

        try {
          setSubmitting(
            true
          );

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

          await refreshParentBudgetMonth();

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
              isUpdating
                ? 'Unable to update bill.'
                : 'Unable to create bill.'
            )
          );
        } finally {
          setSubmitting(
            false
          );
        }
      },
      [
        billModalMode,
        selectedBill,
        budgetMonthId,
        loadBills,
        refreshParentBudgetMonth,
      ]
    );

  /*===========================================================
    handleMarkBillPaid
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
      },
      [
        paymentBill,
        loadBills,
        refreshParentBudgetMonth,
      ]
    );

  /*===========================================================
    handleMarkBillUnpaid
  ===========================================================*/
  const handleMarkBillUnpaid =
    useCallback(
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

          await refreshParentBudgetMonth();

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
      },
      [
        selectedBill,
        loadBills,
        refreshParentBudgetMonth,
      ]
    );

  /*===========================================================
    handleOpenDeleteBill
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
    handleCloseDeleteBill
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
    handleDeleteBill
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

  /*===========================================================
    Public hook API
  ===========================================================*/
  return {
    /*---------------------------------------------------------
      Data
    ---------------------------------------------------------*/
    bills,
    availableCategories,
    summary,

    /*---------------------------------------------------------
      Main loading state
    ---------------------------------------------------------*/
    loading,
    error,
    loadBills,

    /*---------------------------------------------------------
      Bill form
    ---------------------------------------------------------*/
    isBillFormOpen,
    selectedBill,
    billModalMode,
    submitting,
    reversingPayment,

    handleOpenCreateBillForm,
    handleOpenBillModal,
    handleCloseBillForm,
    handleCreateCategory,
    handleBillSubmit,
    handleMarkBillUnpaid,

    /*---------------------------------------------------------
      Payment
    ---------------------------------------------------------*/
    isPaymentModalOpen,
    paymentBill,
    paymentSubmitting,

    accounts,
    accountsLoading,
    accountsError,

    handleOpenPaymentModal,
    handleClosePaymentModal,
    handleMarkBillPaid,

    /*---------------------------------------------------------
      Delete
    ---------------------------------------------------------*/
    deleteBillTarget,
    deletingBill,

    handleOpenDeleteBill,
    handleCloseDeleteBill,
    handleDeleteBill,
  };
};