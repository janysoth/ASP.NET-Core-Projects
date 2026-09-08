import React from 'react';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

import ExpenseFormFields from '../components/ExpenseFormFields';

import useExpenseFormState from '../hooks/useExpenseFormState';

/*===========================================================
  ExpenseForm:
  => Coordinates the Expense form.

  Supports:
  => Create mode.
  => Edit mode.

  Architecture:
  => useExpenseFormState owns field state and validation.
  => ExpenseFormFields owns field UI.
  => ExpenseForm owns submit and action buttons.

  IMPORTANT:
  => Does NOT call the API directly.
  => useExpenseForm owns the API/modal workflow.
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

  minDate = null,
  maxDate = null,
}) => {
  /*===========================================================
    Form State
  ===========================================================*/
  const form =
    useExpenseFormState({
      mode,
      expense,
      accounts,
      categories,
      createdCategoryId,
    });

  /*===========================================================
    Submit:
    => Form hook validates and builds the API payload.
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      submitting
    ) {
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
      <ExpenseFormFields
        accounts={
          accounts
        }
        categories={
          categories
        }
        accountId={
          form.accountId
        }
        categoryId={
          form.categoryId
        }
        name={
          form.name
        }
        amount={
          form.amount
        }
        expenseDate={
          form.expenseDate
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
        onCategoryChange={
          form.handleCategoryChange
        }
        onNameChange={
          form.handleNameChange
        }
        onAmountChange={
          form.handleAmountChange
        }
        onExpenseDateChange={
          form.handleExpenseDateChange
        }
        onNotesChange={
          form.handleNotesChange
        }
        onCreateCategory={
          onCreateCategory
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
              ? 'Saving expense...'
              : 'Adding expense...'
          }
        >
          {form.isEditing
            ? 'Save changes'
            : 'Add expense'}
        </AppButton>
      </ModalActions>
    </form>
  );
};

export default ExpenseForm;