import React, {
  useMemo,
} from 'react';

import {
  PlusIcon,
} from '@/components/icons/Icons';

import {
  DateInput,
  MoneyInput,
  SelectInput,
  TextareaInput,
  TextInput,
} from '@/components/inputs';

import {
  AppButton,
} from '@/components/ui';

/*===========================================================
  ExpenseFormFields:
  => Displays Expense form fields only.

  Handles UI:
  => Account.
  => Category.
  => Expense name.
  => Amount.
  => Expense date.
  => Notes.
  => Account loading/error state.
  => Category quick-create action.

  IMPORTANT:
  => Does NOT own state.
  => Does NOT validate.
  => Does NOT call APIs.
===========================================================*/
const ExpenseFormFields = ({
  accounts = [],
  categories = [],

  accountId,
  categoryId,
  name,
  amount,
  expenseDate,
  notes,

  validationErrors = {},

  accountsLoading = false,
  accountsError = '',

  disabled = false,

  minDate = null,
  maxDate = null,

  onAccountChange,
  onCategoryChange,
  onNameChange,
  onAmountChange,
  onExpenseDateChange,
  onNotesChange,

  onCreateCategory,
}) => {
  /*===========================================================
    Account Options
  ===========================================================*/
  const accountOptions =
    useMemo(
      () => [
        {
          value: '',
          label:
            accountsLoading
              ? 'Loading accounts...'
              : 'Select an account',
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
        accountsLoading,
      ]
    );

  /*===========================================================
    Category Options
  ===========================================================*/
  const categoryOptions =
    useMemo(
      () => [
        {
          value: '',
          label:
            categories.length === 0
              ? 'No categories available'
              : 'Select a category',
        },

        ...categories.map(
          (
            category
          ) => ({
            value:
              category.id,

            label:
              `${category.name} · ${category.type}`,
          })
        ),
      ],
      [
        categories,
      ]
    );

  return (
    <div className="space-y-5">
      {/*=======================================================
        Account
      =======================================================*/}
      <div>
        <SelectInput
          label="Account"
          htmlFor="expenseAccountId"
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

        {accountsError && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {accountsError}
          </p>
        )}
      </div>

      {/*=======================================================
        Category
      =======================================================*/}
      <div>
        <SelectInput
          label="Category"
          htmlFor="expenseCategoryId"
          name="categoryId"
          value={
            categoryId
          }
          options={
            categoryOptions
          }
          onChange={(event) =>
            onCategoryChange?.(
              event.target.value
            )
          }
          disabled={
            disabled
          }
          error={
            validationErrors.categoryId
          }
        />

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
              disabled
            }
          >
            <PlusIcon className="h-4 w-4" />

            <span>
              Create category
            </span>
          </AppButton>
        </div>
      </div>

      {/*=======================================================
        Expense Name
      =======================================================*/}
      <TextInput
        label="Expense name"
        htmlFor="expenseName"
        name="name"
        value={
          name
        }
        onChange={(event) =>
          onNameChange?.(
            event.target.value
          )
        }
        disabled={
          disabled
        }
        placeholder="Example: Grocery shopping"
        error={
          validationErrors.name
        }
      />

      {/*=======================================================
        Amount
      =======================================================*/}
      <MoneyInput
        label="Amount"
        htmlFor="expenseAmount"
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
        Expense Date
      =======================================================*/}
      <DateInput
        label="Expense date"
        htmlFor="expenseDate"
        name="expenseDate"
        value={
          expenseDate
        }
        onChange={
          onExpenseDateChange
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
          validationErrors.expenseDate
        }
      />

      {/*=======================================================
        Notes
      =======================================================*/}
      <TextareaInput
        label="Notes"
        htmlFor="expenseNotes"
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
        placeholder="Add expense notes..."
        rows={3}
        optional
        error={
          validationErrors.notes
        }
      />
    </div>
  );
};

export default ExpenseFormFields;