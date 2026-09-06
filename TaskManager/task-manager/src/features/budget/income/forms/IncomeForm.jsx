import React, {
  useMemo,
} from 'react';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

import {
  IncomeFormFields,
} from './components';

import useIncomeFormState from './hooks/useIncomeFormState';

/*===========================================================
  IncomeForm:
  => Coordinates the Income form.

  Supports:
  => Create mode.
  => Edit mode.

  Architecture:
  => useIncomeFormState owns state / validation.
  => IncomeFormFields owns field UI.
  => IncomeForm coordinates submission / actions.

  IMPORTANT:
  => Does not call the API directly.
  => Parent workflow owns API submission.
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

  minDate = null,
  maxDate = null,
}) => {
  /*===========================================================
    Form State
  ===========================================================*/
  const form =
    useIncomeFormState({
      mode,
      income,
      accounts,
    });

  /*===========================================================
    Account Options:
    => Converts API account objects into SelectInput options.
  ===========================================================*/
  const accountOptions =
    useMemo(
      () =>
        accounts.map(
          (
            account
          ) => ({
            value:
              account.id,

            label:
              account.name,
          })
        ),
      [
        accounts,
      ]
    );

  /*===========================================================
    Submit
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const payload =
      form.createPayload();

    if (!payload) {
      return;
    }

    onSubmit?.(
      payload
    );
  };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5"
    >
      {/*=======================================================
        Fields
      =======================================================*/}
      <IncomeFormFields
        accountOptions={
          accountOptions
        }
        accountId={
          form.accountId
        }
        source={
          form.source
        }
        amount={
          form.amount
        }
        incomeDate={
          form.incomeDate
        }
        notes={
          form.notes
        }
        validationErrors={
          form.validationErrors
        }
        accountsLoading={
          accountsLoading
        }
        accountsError={
          accountsError
        }
        disabled={
          submitting
        }
        minDate={
          minDate
        }
        maxDate={
          maxDate
        }
        onAccountChange={
          form.handleAccountChange
        }
        onSourceChange={
          form.handleSourceChange
        }
        onAmountChange={
          form.handleAmountChange
        }
        onIncomeDateChange={
          form.handleIncomeDateChange
        }
        onNotesChange={
          form.handleNotesChange
        }
      />

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
            form.isEditing
              ? 'Saving income...'
              : 'Adding income...'
          }
        >
          {form.isEditing
            ? 'Save changes'
            : 'Add income'}
        </AppButton>
      </ModalActions>
    </form>
  );
};

export default IncomeForm;