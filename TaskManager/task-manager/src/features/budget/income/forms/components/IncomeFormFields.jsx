import React from 'react';

import {
  DateInput,
  MoneyInput,
  SelectInput,
  TextareaInput,
  TextInput,
} from '@/components/inputs';

/*===========================================================
  IncomeFormFields:
  => Displays Income form fields.

  Handles UI:
  => Account.
  => Source.
  => Amount.
  => Income Date.
  => Notes.
  => Account loading / error / empty states.

  IMPORTANT:
  => Does NOT own form state.
  => Does NOT validate.
  => Does NOT call the API.
===========================================================*/
const IncomeFormFields = ({
  accountOptions = [],

  accountId,
  source,
  amount,
  incomeDate,
  notes,

  validationErrors = {},

  accountsLoading = false,
  accountsError = '',

  disabled = false,

  minDate = null,
  maxDate = null,

  onAccountChange,
  onSourceChange,
  onAmountChange,
  onIncomeDateChange,
  onNotesChange,
}) => {
  const noAccountsAvailable =
    !accountsLoading &&
    !accountsError &&
    accountOptions.length === 0;

  return (
    <div className="space-y-5">
      {/*=======================================================
        Account
      =======================================================*/}
      <div>
        <SelectInput
          label="Account"
          htmlFor="incomeAccountId"
          name="accountId"
          value={
            accountId
          }
          options={
            accountOptions
          }
          onChange={(event) =>
            onAccountChange?.(
              event.target.value
            )
          }
          disabled={
            disabled ||
            accountsLoading
          }
          error={
            validationErrors.accountId
          }
        />

        {accountsLoading && (
          <p className="mt-2 text-xs text-[var(--app-text-muted)]">
            Loading accounts...
          </p>
        )}

        {accountsError && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {accountsError}
          </p>
        )}

        {noAccountsAvailable && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            No eligible income accounts are available.
          </p>
        )}
      </div>

      {/*=======================================================
        Source
      =======================================================*/}
      <TextInput
        label="Source"
        htmlFor="incomeSource"
        name="source"
        value={
          source
        }
        onChange={(event) =>
          onSourceChange?.(
            event.target.value
          )
        }
        disabled={
          disabled
        }
        placeholder="Example: Paycheck"
        error={
          validationErrors.source
        }
      />

      {/*=======================================================
        Amount
      =======================================================*/}
      <MoneyInput
        label="Amount"
        htmlFor="incomeAmount"
        name="amount"
        value={
          amount
        }
        onValueChange={
          onAmountChange
        }
        disabled={
          disabled
        }
        error={
          validationErrors.amount
        }
      />

      {/*=======================================================
        Income Date
      =======================================================*/}
      <DateInput
        label="Income date"
        htmlFor="incomeDate"
        name="incomeDate"
        value={
          incomeDate
        }
        onChange={
          onIncomeDateChange
        }
        minDate={
          minDate
        }
        maxDate={
          maxDate
        }
        disabled={
          disabled
        }
        error={
          validationErrors.incomeDate
        }
      />

      {/*=======================================================
        Notes
      =======================================================*/}
      <TextareaInput
        label="Notes"
        htmlFor="incomeNotes"
        name="notes"
        value={
          notes
        }
        onChange={(event) =>
          onNotesChange?.(
            event.target.value
          )
        }
        disabled={
          disabled
        }
        placeholder="Add income notes..."
        rows={3}
        optional
        error={
          validationErrors.notes
        }
      />
    </div>
  );
};

export default IncomeFormFields;