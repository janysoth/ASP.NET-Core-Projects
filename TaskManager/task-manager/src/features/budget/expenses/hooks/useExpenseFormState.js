import {
  useEffect,
  useMemo,
  useState,
} from 'react';

/*===========================================================
  useExpenseFormState:
  => Owns Expense form field state and validation.

  Handles:
  => Create mode.
  => Edit mode.
  => Account.
  => Category.
  => Expense name.
  => Amount.
  => Expense date.
  => Notes.
  => Newly-created category selection.
  => Validation.
  => API payload creation.

  IMPORTANT:
  => Does NOT control modal state.
  => Does NOT call the API.
  => useExpenseForm owns the create/edit API workflow.
===========================================================*/
const useExpenseFormState = ({
  mode = 'create',

  expense = null,

  accounts = [],
  categories = [],

  createdCategoryId = '',
}) => {
  /*===========================================================
    Edit Mode
  ===========================================================*/
  const isEditing =
    mode === 'edit';

  /*===========================================================
    Default Expense Date:
    => Uses today's local calendar date.
    => Stored by the form as YYYY-MM-DD.
  ===========================================================*/
  const defaultExpenseDate =
    useMemo(
      () => {
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
      },
      []
    );

  /*===========================================================
    Form State
  ===========================================================*/
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
    Load / Reset Form:
    => Edit mode loads selected Expense.
    => Create mode restores empty/default values.
  ===========================================================*/
  useEffect(() => {
    if (
      isEditing &&
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
        expense.expenseDate
          ?.slice(
            0,
            10
          ) ??
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
    isEditing,
    expense,
    defaultExpenseDate,
  ]);

  /*===========================================================
    Newly-Created Category:
    => Automatically selects the category after the category
       quick-create workflow finishes.
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
        currentErrors
      ) => {
        if (
          !currentErrors.categoryId
        ) {
          return currentErrors;
        }

        const updatedErrors = {
          ...currentErrors,
        };

        delete updatedErrors
          .categoryId;

        return updatedErrors;
      }
    );
  }, [
    createdCategoryId,
  ]);

  /*===========================================================
    Clear Field Error
  ===========================================================*/
  const clearFieldError = (
    fieldName
  ) => {
    setValidationErrors(
      (
        currentErrors
      ) => {
        if (
          !currentErrors[
          fieldName
          ]
        ) {
          return currentErrors;
        }

        const updatedErrors = {
          ...currentErrors,
        };

        delete updatedErrors[
          fieldName
        ];

        return updatedErrors;
      }
    );
  };

  /*===========================================================
    Account Change
  ===========================================================*/
  const handleAccountChange = (
    nextAccountId
  ) => {
    setAccountId(
      nextAccountId
    );

    clearFieldError(
      'accountId'
    );
  };

  /*===========================================================
    Category Change
  ===========================================================*/
  const handleCategoryChange = (
    nextCategoryId
  ) => {
    setCategoryId(
      nextCategoryId
    );

    clearFieldError(
      'categoryId'
    );
  };

  /*===========================================================
    Name Change
  ===========================================================*/
  const handleNameChange = (
    nextName
  ) => {
    setName(
      nextName
    );

    clearFieldError(
      'name'
    );
  };

  /*===========================================================
    Amount Change
  ===========================================================*/
  const handleAmountChange = (
    nextAmount
  ) => {
    setAmount(
      nextAmount
    );

    clearFieldError(
      'amount'
    );
  };

  /*===========================================================
    Expense Date Change
  ===========================================================*/
  const handleExpenseDateChange = (
    nextDate
  ) => {
    setExpenseDate(
      nextDate
    );

    clearFieldError(
      'expenseDate'
    );
  };

  /*===========================================================
    Notes Change
  ===========================================================*/
  const handleNotesChange = (
    nextNotes
  ) => {
    setNotes(
      nextNotes
    );

    clearFieldError(
      'notes'
    );
  };

  /*===========================================================
    Validate
  ===========================================================*/
  const validate = () => {
    const errors = {};

    const normalizedAmount =
      amount === ''
        ? 0
        : Number(
          amount
        );

    /*=========================================================
      Account
    =========================================================*/
    if (!accountId) {
      errors.accountId =
        'Account is required.';
    } else {
      const accountExists =
        accounts.some(
          (
            account
          ) =>
            account.id ===
            accountId
        );

      if (!accountExists) {
        errors.accountId =
          'Select a valid account.';
      }
    }

    /*=========================================================
      Category
    =========================================================*/
    if (!categoryId) {
      errors.categoryId =
        'Category is required.';
    } else {
      const categoryExists =
        categories.some(
          (
            category
          ) =>
            category.id ===
            categoryId
        );

      if (!categoryExists) {
        errors.categoryId =
          'Select a valid category.';
      }
    }

    /*=========================================================
      Expense Name
    =========================================================*/
    if (
      !name.trim()
    ) {
      errors.name =
        'Expense name is required.';
    }

    /*=========================================================
      Amount
    =========================================================*/
    if (
      Number.isNaN(
        normalizedAmount
      ) ||
      normalizedAmount <= 0
    ) {
      errors.amount =
        'Amount must be greater than 0.';
    }

    /*=========================================================
      Expense Date
    =========================================================*/
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
    Create Payload:
    => Returns null when validation fails.

    Date:
    => Form stores YYYY-MM-DD.
    => API receives YYYY-MM-DDT00:00:00Z.
  ===========================================================*/
  const createPayload = () => {
    if (!validate()) {
      return null;
    }

    return {
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
    };
  };

  return {
    /*=========================================================
      Mode
    =========================================================*/
    isEditing,

    /*=========================================================
      Values
    =========================================================*/
    accountId,
    categoryId,
    name,
    amount,
    expenseDate,
    notes,

    /*=========================================================
      Validation
    =========================================================*/
    validationErrors,

    /*=========================================================
      Field Actions
    =========================================================*/
    handleAccountChange,
    handleCategoryChange,
    handleNameChange,
    handleAmountChange,
    handleExpenseDateChange,
    handleNotesChange,

    /*=========================================================
      Submission
    =========================================================*/
    createPayload,
  };
};

export default useExpenseFormState;