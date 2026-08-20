import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

import {
  PlusIcon,
} from '@/components/icons/Icons';

/*===========================================================
  getTodayDateValue
===========================================================*/
const getTodayDateValue = () => {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
};

/*===========================================================
  getDateInputValue
===========================================================*/
const getDateInputValue = (
  value
) => {
  if (!value) {
    return '';
  }

  return String(
    value
  ).slice(
    0,
    10
  );
};

/*===========================================================
  ExpenseForm
===========================================================*/
const ExpenseForm = ({
  mode = 'create',
  expense = null,

  accounts = [],
  categories = [],

  createdCategoryId = '',

  accountsLoading = false,
  accountsError = '',

  onCreateCategory,
  onSubmit,
  onCancel,

  submitting = false,
}) => {
  const defaultExpenseDate =
    useMemo(
      () =>
        getTodayDateValue(),
      []
    );

  const [
    accountId,
    setAccountId,
  ] = useState('');

  const [
    categoryId,
    setCategoryId,
  ] = useState('');

  const [
    name,
    setName,
  ] = useState('');

  const [
    amount,
    setAmount,
  ] = useState('');

  const [
    expenseDate,
    setExpenseDate,
  ] = useState(
    defaultExpenseDate
  );

  const [
    notes,
    setNotes,
  ] = useState('');

  const [
    validationErrors,
    setValidationErrors,
  ] = useState({});

  /*===========================================================
    Load / Reset Form
  ===========================================================*/
  useEffect(() => {
    if (
      mode === 'edit' &&
      expense
    ) {
      setAccountId(
        expense.accountId ??
        ''
      );

      setCategoryId(
        expense.categoryId ??
        ''
      );

      setName(
        expense.name ??
        ''
      );

      setAmount(
        expense.amount
          ?.toString() ??
        ''
      );

      setExpenseDate(
        getDateInputValue(
          expense.expenseDate
        ) ||
        defaultExpenseDate
      );

      setNotes(
        expense.notes ??
        ''
      );

      setValidationErrors({});

      return;
    }

    setAccountId('');
    setCategoryId('');
    setName('');
    setAmount('');

    setExpenseDate(
      defaultExpenseDate
    );

    setNotes('');
    setValidationErrors({});
  }, [
    mode,
    expense,
    defaultExpenseDate,
  ]);

  /*===========================================================
    Automatically Select Newly-Created Category
  ===========================================================*/
  useEffect(() => {
    if (
      !createdCategoryId
    ) {
      return;
    }

    setCategoryId(
      createdCategoryId
    );

    setValidationErrors(
      (
        current
      ) => ({
        ...current,
        categoryId:
          undefined,
      })
    );
  }, [
    createdCategoryId,
  ]);

  /*===========================================================
    Validate
  ===========================================================*/
  const validate = () => {
    const errors = {};

    if (!accountId) {
      errors.accountId =
        'Account is required.';
    }

    if (!categoryId) {
      errors.categoryId =
        'Category is required.';
    }

    if (!name.trim()) {
      errors.name =
        'Expense name is required.';
    }

    const normalizedAmount =
      Number(
        amount
      );

    if (
      !amount ||
      Number.isNaN(
        normalizedAmount
      ) ||
      normalizedAmount <= 0
    ) {
      errors.amount =
        'Amount must be greater than 0.';
    }

    if (!expenseDate) {
      errors.expenseDate =
        'Expense date is required.';
    }

    setValidationErrors(
      errors
    );

    return (
      Object.keys(
        errors
      ).length === 0
    );
  };

  /*===========================================================
    Submit
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      submitting ||
      !validate()
    ) {
      return;
    }

    onSubmit?.({
      accountId,
      categoryId,

      name:
        name.trim(),

      amount:
        Number(
          amount
        ),

      expenseDate:
        `${expenseDate}T00:00:00Z`,

      notes:
        notes.trim()
          ? notes.trim()
          : null,
    });
  };

  const isEditing =
    mode === 'edit';

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5"
    >
      {/*=======================================================
        Account
      =======================================================*/}
      <div>
        <label
          htmlFor="expenseAccountId"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Account
        </label>

        <select
          id="expenseAccountId"
          value={
            accountId
          }
          onChange={(event) => {
            setAccountId(
              event.target.value
            );

            setValidationErrors(
              (
                current
              ) => ({
                ...current,
                accountId:
                  undefined,
              })
            );
          }}
          disabled={
            submitting ||
            accountsLoading
          }
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition ${validationErrors.accountId
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        >
          <option value="">
            {accountsLoading
              ? 'Loading accounts...'
              : 'Select an account'}
          </option>

          {accounts.map(
            (
              account
            ) => (
              <option
                key={
                  account.id
                }
                value={
                  account.id
                }
              >
                {account.name}
              </option>
            )
          )}
        </select>

        {accountsError && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {accountsError}
          </p>
        )}

        {validationErrors.accountId && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.accountId
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Category
      =======================================================*/}
      <div>
        <label
          htmlFor="expenseCategoryId"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Category
        </label>

        <select
          id="expenseCategoryId"
          value={
            categoryId
          }
          onChange={(event) => {
            setCategoryId(
              event.target.value
            );

            setValidationErrors(
              (
                current
              ) => ({
                ...current,
                categoryId:
                  undefined,
              })
            );
          }}
          disabled={
            submitting
          }
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition ${validationErrors.categoryId
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        >
          <option value="">
            {categories.length === 0
              ? 'No categories available'
              : 'Select a category'}
          </option>

          {categories.map(
            (
              category
            ) => (
              <option
                key={
                  category.id
                }
                value={
                  category.id
                }
              >
                {category.name} · {category.type}
              </option>
            )
          )}
        </select>

        {categories.length === 0 ? (
          <div className="mt-2">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              No expense categories are available.
            </p>

            <p className="mt-1 text-xs text-[var(--app-text-muted)]">
              Create your first Fixed or Variable Expense category to continue.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-[var(--app-text-muted)]">
            Need another expense category?
          </p>
        )}

        <div className="mt-2">
          <AppButton
            type="button"
            variant="secondary"
            onClick={
              onCreateCategory
            }
            disabled={
              submitting
            }
          >
            <PlusIcon className="h-4 w-4" />

            <span>
              Create category
            </span>
          </AppButton>
        </div>

        {validationErrors.categoryId && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.categoryId
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Expense Name
      =======================================================*/}
      <div>
        <label
          htmlFor="expenseName"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Expense name
        </label>

        <input
          id="expenseName"
          type="text"
          value={
            name
          }
          onChange={(event) => {
            setName(
              event.target.value
            );

            setValidationErrors(
              (
                current
              ) => ({
                ...current,
                name:
                  undefined,
              })
            );
          }}
          disabled={
            submitting
          }
          placeholder="Example: Grocery shopping"
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition ${validationErrors.name
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        />

        {validationErrors.name && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.name
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Amount
      =======================================================*/}
      <div>
        <label
          htmlFor="expenseAmount"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Amount
        </label>

        <input
          id="expenseAmount"
          type="number"
          min="0.01"
          step="0.01"
          value={
            amount
          }
          onChange={(event) => {
            setAmount(
              event.target.value
            );

            setValidationErrors(
              (
                current
              ) => ({
                ...current,
                amount:
                  undefined,
              })
            );
          }}
          disabled={
            submitting
          }
          placeholder="0.00"
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition ${validationErrors.amount
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        />

        {validationErrors.amount && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.amount
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Expense Date
      =======================================================*/}
      <div>
        <label
          htmlFor="expenseDate"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Expense date
        </label>

        <input
          id="expenseDate"
          type="date"
          value={
            expenseDate
          }
          onChange={(event) => {
            setExpenseDate(
              event.target.value
            );

            setValidationErrors(
              (
                current
              ) => ({
                ...current,
                expenseDate:
                  undefined,
              })
            );
          }}
          disabled={
            submitting
          }
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition ${validationErrors.expenseDate
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        />

        {validationErrors.expenseDate && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.expenseDate
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Notes
      =======================================================*/}
      <div>
        <label
          htmlFor="expenseNotes"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Notes

          <span className="ml-1 font-normal text-[var(--app-text-muted)]">
            (optional)
          </span>
        </label>

        <textarea
          id="expenseNotes"
          rows={3}
          value={
            notes
          }
          onChange={(event) =>
            setNotes(
              event.target.value
            )
          }
          disabled={
            submitting
          }
          placeholder="Add expense notes..."
          className="mt-2 w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-primary)]"
        />
      </div>

      {/*=======================================================
        Actions
      =======================================================*/}
      <ModalActions>
        <AppButton
          variant="secondary"
          onClick={
            onCancel
          }
          disabled={
            submitting
          }
        >
          Cancel
        </AppButton>

        <AppButton
          type="submit"
          variant="primary"
          loading={
            submitting
          }
          loadingText={
            isEditing
              ? 'Saving expense...'
              : 'Adding expense...'
          }
        >
          {isEditing
            ? 'Save changes'
            : 'Add expense'}
        </AppButton>
      </ModalActions>
    </form>
  );
};

export default ExpenseForm;