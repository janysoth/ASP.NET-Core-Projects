import {
  useEffect,
  useMemo,
  useState,
} from 'react';

/*===========================================================
  useIncomeFormState:
  => Owns Income form state and validation.

  Handles:
  => Create mode.
  => Edit mode.
  => Account.
  => Source.
  => Amount.
  => Income date.
  => Notes.
  => Validation.
  => API payload creation.

  IMPORTANT:
  => Does NOT call the API.
  => Does NOT render UI.
  => Parent form owns submission.
===========================================================*/
const useIncomeFormState = ({
  mode = 'create',

  income = null,

  accounts = [],
}) => {
  /*===========================================================
    Edit Mode
  ===========================================================*/
  const isEditing =
    mode === 'edit';

  /*===========================================================
    Default Date:
    => Uses today's local date.
    => Stored by the form as YYYY-MM-DD.
  ===========================================================*/
  const defaultDate =
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
    defaultDate
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
      isEditing &&
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
        income.incomeDate
          ?.slice(
            0,
            10
          ) ??
        defaultDate
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
      defaultDate
    );
    setNotes('');
    setValidationErrors({});
  }, [
    isEditing,
    income,
    defaultDate,
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

        return {
          ...currentErrors,

          [fieldName]:
            undefined,
        };
      }
    );
  };

  /*===========================================================
    Field Changes
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

  const handleSourceChange = (
    nextSource
  ) => {
    setSource(
      nextSource
    );

    clearFieldError(
      'source'
    );
  };

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

  const handleIncomeDateChange = (
    nextDate
  ) => {
    setIncomeDate(
      nextDate
    );

    clearFieldError(
      'incomeDate'
    );
  };

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
      Source
    =========================================================*/
    if (
      !source.trim()
    ) {
      errors.source =
        'Income source is required.';
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
      Income Date
    =========================================================*/
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
    Create Payload:
    => Returns normalized API payload.
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
    };
  };

  return {
    isEditing,

    accountId,
    source,
    amount,
    incomeDate,
    notes,

    validationErrors,

    handleAccountChange,
    handleSourceChange,
    handleAmountChange,
    handleIncomeDateChange,
    handleNotesChange,

    createPayload,
  };
};

export default useIncomeFormState;