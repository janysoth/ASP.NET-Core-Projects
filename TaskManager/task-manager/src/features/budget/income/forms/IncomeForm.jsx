import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

/*===========================================================
  getTodayDateValue:
  => Returns today's local calendar date in YYYY-MM-DD format.
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
  getDateInputValue:
  => Converts an API date into YYYY-MM-DD for <input type=date>.
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
  IncomeForm:
  => Collects values for creating or editing income.

  Modes:
  => create
  => edit

  IMPORTANT:
  => Does not call the API directly.
  => Parent hook controls submission.
===========================================================*/
const IncomeForm = ({
  mode = 'create',
  income = null,

  accounts = [],
  onSubmit,
  onCancel,

  accountsLoading = false,
  accountsError = '',

  submitting = false,
}) => {
  const defaultIncomeDate =
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
    source,
    setSource,
  ] = useState('');

  const [
    amount,
    setAmount,
  ] = useState('');

  const [
    incomeDate,
    setIncomeDate,
  ] = useState(
    defaultIncomeDate
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
    Reset / Load Form:
    => Edit mode loads the selected income.
    => Create mode restores empty/default values.
  ===========================================================*/
  useEffect(() => {
    if (
      mode === 'edit' &&
      income
    ) {
      setAccountId(
        income.accountId ??
        ''
      );

      setSource(
        income.source ??
        ''
      );

      setAmount(
        income.amount
          ?.toString() ??
        ''
      );

      setIncomeDate(
        getDateInputValue(
          income.incomeDate
        ) ||
        defaultIncomeDate
      );

      setNotes(
        income.notes ??
        ''
      );

      setValidationErrors({});

      return;
    }

    setAccountId('');
    setSource('');
    setAmount('');

    setIncomeDate(
      defaultIncomeDate
    );

    setNotes('');
    setValidationErrors({});
  }, [
    mode,
    income,
    defaultIncomeDate,
  ]);

  /*===========================================================
    Validate:
    => Checks required income values.
  ===========================================================*/
  const validate = () => {
    const errors = {};

    if (!accountId) {
      errors.accountId =
        'Account is required.';
    }

    if (!source.trim()) {
      errors.source =
        'Income source is required.';
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

    if (!incomeDate) {
      errors.incomeDate =
        'Income date is required.';
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
    handleSubmit:
    => Converts values into the create/update income payload.
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

      source:
        source.trim(),

      amount:
        Number(
          amount
        ),

      incomeDate:
        `${incomeDate}T00:00:00Z`,

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
          htmlFor="incomeAccountId"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Account
        </label>

        <select
          id="incomeAccountId"
          value={
            accountId
          }
          onChange={(event) => {
            setAccountId(
              event.target.value
            );

            setValidationErrors(
              (
                currentErrors
              ) => ({
                ...currentErrors,
                accountId:
                  undefined,
              })
            );
          }}
          disabled={
            submitting ||
            accountsLoading
          }
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.accountId
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

        {!accountsLoading &&
          !accountsError &&
          accounts.length === 0 && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              No eligible income accounts are available.
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
        Source
      =======================================================*/}
      <div>
        <label
          htmlFor="incomeSource"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Source
        </label>

        <input
          id="incomeSource"
          type="text"
          value={
            source
          }
          onChange={(event) => {
            setSource(
              event.target.value
            );

            setValidationErrors(
              (
                currentErrors
              ) => ({
                ...currentErrors,
                source:
                  undefined,
              })
            );
          }}
          disabled={
            submitting
          }
          placeholder="Example: Paycheck"
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.source
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        />

        {validationErrors.source && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.source
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Amount
      =======================================================*/}
      <div>
        <label
          htmlFor="incomeAmount"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Amount
        </label>

        <input
          id="incomeAmount"
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
                currentErrors
              ) => ({
                ...currentErrors,
                amount:
                  undefined,
              })
            );
          }}
          disabled={
            submitting
          }
          placeholder="0.00"
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.amount
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
        Income Date
      =======================================================*/}
      <div>
        <label
          htmlFor="incomeDate"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Income date
        </label>

        <input
          id="incomeDate"
          type="date"
          value={
            incomeDate
          }
          onChange={(event) => {
            setIncomeDate(
              event.target.value
            );

            setValidationErrors(
              (
                currentErrors
              ) => ({
                ...currentErrors,
                incomeDate:
                  undefined,
              })
            );
          }}
          disabled={
            submitting
          }
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.incomeDate
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        />

        {validationErrors.incomeDate && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.incomeDate
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Notes
      =======================================================*/}
      <div>
        <label
          htmlFor="incomeNotes"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Notes

          <span className="ml-1 font-normal text-[var(--app-text-muted)]">
            (optional)
          </span>
        </label>

        <textarea
          id="incomeNotes"
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
          placeholder="Add income notes..."
          className="mt-2 w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70"
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
              ? 'Saving income...'
              : 'Adding income...'
          }
        >
          {isEditing
            ? 'Save changes'
            : 'Add income'}
        </AppButton>
      </ModalActions>
    </form>
  );
};

export default IncomeForm;