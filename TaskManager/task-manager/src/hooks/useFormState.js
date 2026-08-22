import {
  useCallback,
  useState,
} from 'react';

/*===========================================================
  useFormState:
  => Shared form-state helper for application forms.

  Handles:
  => Form values.
  => Validation errors.
  => Updating one field.
  => Updating many fields.
  => Clearing one error.
  => Replacing errors.
  => Resetting the form.

  IMPORTANT:
  => Does not know anything about a specific feature.
  => Does not perform validation.
  => Does not submit API requests.
===========================================================*/
const useFormState = (
  initialValues = {}
) => {
  /*===========================================================
    Values
  ===========================================================*/
  const [
    values,
    setValues,
  ] = useState(
    initialValues
  );

  /*===========================================================
    Errors
  ===========================================================*/
  const [
    errors,
    setErrors,
  ] = useState({});

  /*===========================================================
    setValue:
    => Updates one form field.
    => Clears that field's validation error automatically.
  ===========================================================*/
  const setValue =
    useCallback(
      (
        name,
        value
      ) => {
        setValues(
          (
            currentValues
          ) => ({
            ...currentValues,
            [name]: value,
          })
        );

        setErrors(
          (
            currentErrors
          ) => {
            if (
              !currentErrors[
              name
              ]
            ) {
              return currentErrors;
            }

            return {
              ...currentErrors,
              [name]: undefined,
            };
          }
        );
      },
      []
    );

  /*===========================================================
    updateValues:
    => Updates multiple values at once.

    Example:
    updateValues({
      source: 'Paycheck',
      amount: '2000',
    });
  ===========================================================*/
  const updateValues =
    useCallback(
      (
        nextValues
      ) => {
        if (
          !nextValues ||
          typeof nextValues !==
          'object'
        ) {
          return;
        }

        setValues(
          (
            currentValues
          ) => ({
            ...currentValues,
            ...nextValues,
          })
        );
      },
      []
    );

  /*===========================================================
    replaceValues:
    => Completely replaces current form values.

    Useful for:
    => Loading an existing record into Edit mode.
    => Resetting to fresh defaults.
  ===========================================================*/
  const replaceValues =
    useCallback(
      (
        nextValues
      ) => {
        setValues(
          nextValues ??
          {}
        );

        setErrors({});
      },
      []
    );

  /*===========================================================
    clearError
  ===========================================================*/
  const clearError =
    useCallback(
      (
        name
      ) => {
        setErrors(
          (
            currentErrors
          ) => {
            if (
              !currentErrors[
              name
              ]
            ) {
              return currentErrors;
            }

            return {
              ...currentErrors,
              [name]: undefined,
            };
          }
        );
      },
      []
    );

  /*===========================================================
    clearErrors
  ===========================================================*/
  const clearErrors =
    useCallback(() => {
      setErrors({});
    }, []);

  /*===========================================================
    reset:
    => Resets values to the supplied values.

    If no values are supplied:
    => Resets back to initialValues.
  ===========================================================*/
  const reset =
    useCallback(
      (
        nextValues
      ) => {
        setValues(
          nextValues ??
          initialValues
        );

        setErrors({});
      },
      [
        initialValues,
      ]
    );

  return {
    values,
    errors,

    setValues,
    setErrors,

    setValue,
    updateValues,
    replaceValues,

    clearError,
    clearErrors,

    reset,
  };
};

export default useFormState;