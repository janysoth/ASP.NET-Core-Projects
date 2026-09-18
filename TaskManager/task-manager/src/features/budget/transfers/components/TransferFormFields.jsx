import React, {
  useMemo,
} from 'react';

import {
  DateInput,
  MoneyInput,
  SelectInput,
  TextareaInput,
} from '@/components/inputs';

/*===========================================================
  TransferFormFields:
  => Displays Transfer form fields only.

  Handles UI:
  => From Account.
  => To Account.
  => Amount.
  => Transfer Date.
  => Notes.

  IMPORTANT:
  => Does NOT own state.
  => Does NOT validate.
  => Does NOT call the API.
===========================================================*/
const TransferFormFields = ({
  accounts = [],

  formValues,
  validationErrors = {},

  minDate = '',
  maxDate = '',

  disabled = false,

  onFieldChange,
}) => {
  /*===========================================================
    Account Options
  ===========================================================*/
  const accountOptions =
    useMemo(
      () => [
        {
          value: '',
          label: 'Select an account',
        },

        ...accounts.map(
          (
            account
          ) => ({
            value:
              account.id,

            label:
              account.name,
          })
        ),
      ],
      [
        accounts,
      ]
    );

  return (
    <div className="space-y-5">
      {/*=======================================================
        From Account
      =======================================================*/}
      <SelectInput
        label="From account"
        htmlFor="transferFromAccountId"
        name="fromAccountId"
        value={
          formValues.fromAccountId
        }
        options={
          accountOptions
        }
        onChange={(event) =>
          onFieldChange?.(
            'fromAccountId',
            event.target.value
          )
        }
        disabled={
          disabled
        }
        error={
          validationErrors.fromAccountId
        }
        helperText="Choose the account the money will leave."
      />

      {/*=======================================================
        To Account
      =======================================================*/}
      <SelectInput
        label="To account"
        htmlFor="transferToAccountId"
        name="toAccountId"
        value={
          formValues.toAccountId
        }
        options={
          accountOptions
        }
        onChange={(event) =>
          onFieldChange?.(
            'toAccountId',
            event.target.value
          )
        }
        disabled={
          disabled
        }
        error={
          validationErrors.toAccountId
        }
        helperText="Choose the account that will receive the money."
      />

      {/*=======================================================
        Amount / Transfer Date
      =======================================================*/}
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyInput
          label="Amount"
          htmlFor="transferAmount"
          name="amount"
          value={
            formValues.amount
          }
          onValueChange={(value) =>
            onFieldChange?.(
              'amount',
              value
            )
          }
          disabled={
            disabled
          }
          error={
            validationErrors.amount
          }
        />

        <DateInput
          label="Transfer date"
          htmlFor="transferDate"
          name="transferDate"
          value={
            formValues.transferDate
          }
          onChange={(value) =>
            onFieldChange?.(
              'transferDate',
              value
            )
          }
          minDate={
            minDate
          }
          maxDate={
            maxDate
          }
          popupAlign="modal-center"
          popupOffset={4}
          disabled={
            disabled
          }
          error={
            validationErrors.transferDate
          }
        />
      </div>

      {/*=======================================================
        Notes
      =======================================================*/}
      <TextareaInput
        label="Notes"
        htmlFor="transferNotes"
        name="notes"
        value={
          formValues.notes
        }
        onChange={(event) =>
          onFieldChange?.(
            'notes',
            event.target.value
          )
        }
        disabled={
          disabled
        }
        placeholder="Add transfer notes..."
        rows={3}
        optional
      />
    </div>
  );
};

export default TransferFormFields;