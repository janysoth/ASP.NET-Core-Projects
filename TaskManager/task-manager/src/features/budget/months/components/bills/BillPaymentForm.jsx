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
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

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
  BillPaymentForm:
  => Collects payment details for an unpaid bill.
  => Does not call the API directly.
  => Parent component controls actual submission.
===========================================================*/
const BillPaymentForm = ({
  bill,
  accounts = [],
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const defaultPaidDate =
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
    actualAmount,
    setActualAmount,
  ] = useState('');

  const [
    paidDate,
    setPaidDate,
  ] = useState(
    defaultPaidDate
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
    Reset form:
    => Loads defaults whenever a different bill is selected.
  ===========================================================*/
  useEffect(() => {
    if (!bill) {
      return;
    }

    setAccountId('');

    setActualAmount(
      bill.expectedAmount
        ?.toString() ?? ''
    );

    setPaidDate(
      defaultPaidDate
    );

    setNotes(
      bill.notes ?? ''
    );

    setValidationErrors({});
  }, [
    bill,
    defaultPaidDate,
  ]);

  /*===========================================================
    validate:
    => Checks required payment values.
  ===========================================================*/
  const validate = () => {
    const errors = {};

    if (!accountId) {
      errors.accountId =
        'Payment account is required.';
    }

    const normalizedAmount =
      Number(
        actualAmount
      );

    if (
      !actualAmount ||
      Number.isNaN(
        normalizedAmount
      ) ||
      normalizedAmount <= 0
    ) {
      errors.actualAmount =
        'Actual amount must be greater than 0.';
    }

    if (!paidDate) {
      errors.paidDate =
        'Paid date is required.';
    }

    setValidationErrors(
      errors
    );

    return (
      Object.keys(errors).length ===
      0
    );
  };

  /*===========================================================
    handleSubmit:
    => Converts form values into MarkBillPaidRequest format.
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

      actualAmount:
        Number(
          actualAmount
        ),

      paidDate:
        `${paidDate}T00:00:00Z`,

      notes:
        notes.trim()
          ? notes.trim()
          : null,
    });
  };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5"
    >
      {/*=======================================================
        Bill summary
      =======================================================*/}
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 p-4">
        <p className="text-xs font-medium text-[var(--app-text-muted)]">
          Bill
        </p>

        <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">
          {bill?.name ||
            'Unknown bill'}
        </p>

        <p className="mt-2 text-xs text-[var(--app-text-muted)]">
          Expected amount
        </p>

        <p className="mt-1 text-lg font-bold text-[var(--app-text)]">
          {formatCurrency(
            bill?.expectedAmount
          )}
        </p>
      </div>

      {/*=======================================================
        Payment account
      =======================================================*/}
      <div>
        <label
          htmlFor="paymentAccountId"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Payment account
        </label>

        <select
          id="paymentAccountId"
          value={accountId}
          onChange={(event) => {
            setAccountId(
              event.target.value
            );

            setValidationErrors(
              (currentErrors) => ({
                ...currentErrors,
                accountId:
                  undefined,
              })
            );
          }}
          disabled={submitting}
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.accountId
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        >
          <option value="">
            Select an account
          </option>

          {accounts.map(
            (account) => (
              <option
                key={account.id}
                value={account.id}
              >
                {account.name}
              </option>
            )
          )}
        </select>

        {validationErrors.accountId && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.accountId
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Actual amount
      =======================================================*/}
      <div>
        <label
          htmlFor="actualAmount"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Actual amount
        </label>

        <input
          id="actualAmount"
          type="number"
          min="0.01"
          step="0.01"
          value={actualAmount}
          onChange={(event) => {
            setActualAmount(
              event.target.value
            );

            setValidationErrors(
              (currentErrors) => ({
                ...currentErrors,
                actualAmount:
                  undefined,
              })
            );
          }}
          disabled={submitting}
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.actualAmount
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        />

        {validationErrors.actualAmount && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.actualAmount
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Paid date
      =======================================================*/}
      <div>
        <label
          htmlFor="paidDate"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Paid date
        </label>

        <input
          id="paidDate"
          type="date"
          max={
            defaultPaidDate
          }
          value={
            paidDate
          }
          onChange={(event) => {
            setPaidDate(
              event.target.value
            );

            setValidationErrors(
              (currentErrors) => ({
                ...currentErrors,
                paidDate:
                  undefined,
              })
            );
          }}
          disabled={submitting}
          className={`mt-2 w-full rounded-xl border bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.paidDate
              ? 'border-red-500'
              : 'border-[var(--app-border)] focus:border-[var(--app-primary)]'
            }`}
        />

        {validationErrors.paidDate && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {
              validationErrors.paidDate
            }
          </p>
        )}
      </div>

      {/*=======================================================
        Notes
      =======================================================*/}
      <div>
        <label
          htmlFor="paymentNotes"
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          Notes
          <span className="ml-1 font-normal text-[var(--app-text-muted)]">
            (optional)
          </span>
        </label>

        <textarea
          id="paymentNotes"
          rows={3}
          value={
            notes
          }
          onChange={(event) =>
            setNotes(
              event.target.value
            )
          }
          disabled={submitting}
          placeholder="Add payment notes..."
          className="mt-2 w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>

      <ModalActions>
        <AppButton
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </AppButton>

        <AppButton
          type="submit"
          variant="primary"
          loading={submitting}
          loadingText="Marking paid..."
        >
          Mark paid
        </AppButton>
      </ModalActions>
    </form>
  );
};

export default BillPaymentForm;