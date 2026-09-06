import {
  useCallback,
  useState,
} from 'react';

/*===========================================================
  useBillCategoryForm:
  => Owns the nested Category Form workflow used by BillForm.

  Handles:
  => Open category modal.
  => Close category modal.
  => Category submission.
  => Category API error.
  => Select newly-created category.

  IMPORTANT:
  => Does NOT own the Bill form itself.
  => Parent provides setFormValues and setValidationErrors.
===========================================================*/
const useBillCategoryForm = ({
  onCreateCategory,

  setFormValues,
  setValidationErrors,
}) => {
  /*===========================================================
    Category Modal State
  ===========================================================*/
  const [
    isCategoryFormOpen,
    setIsCategoryFormOpen,
  ] = useState(false);

  /*===========================================================
    Category Submitting
  ===========================================================*/
  const [
    categorySubmitting,
    setCategorySubmitting,
  ] = useState(false);

  /*===========================================================
    Category API Error
  ===========================================================*/
  const [
    categoryApiError,
    setCategoryApiError,
  ] = useState('');

  /*===========================================================
    Open Category Form
  ===========================================================*/
  const openCategoryForm =
    useCallback(() => {
      setCategoryApiError('');

      setIsCategoryFormOpen(
        true
      );
    }, []);

  /*===========================================================
    Close Category Form
  ===========================================================*/
  const closeCategoryForm =
    useCallback(() => {
      if (
        categorySubmitting
      ) {
        return;
      }

      setIsCategoryFormOpen(
        false
      );

      setCategoryApiError('');
    }, [
      categorySubmitting,
    ]);

  /*===========================================================
    Reset Category Form:
    => Used when the parent Bill modal resets.
  ===========================================================*/
  const resetCategoryForm =
    useCallback(() => {
      setIsCategoryFormOpen(
        false
      );

      setCategoryApiError('');
    }, []);

  /*===========================================================
    Create Category
  ===========================================================*/
  const createCategory =
    useCallback(
      async (
        categoryData
      ) => {
        if (
          !onCreateCategory
        ) {
          setCategoryApiError(
            'Category creation is unavailable.'
          );

          return null;
        }

        try {
          setCategorySubmitting(
            true
          );

          setCategoryApiError('');

          const createdCategory =
            await onCreateCategory(
              categoryData
            );

          if (
            !createdCategory?.id
          ) {
            throw new Error(
              'The category was created, but no category ID was returned.'
            );
          }

          /*===================================================
            Select New Category
          ===================================================*/
          setFormValues(
            (
              currentValues
            ) => ({
              ...currentValues,

              budgetCategoryId:
                createdCategory.id,
            })
          );

          /*===================================================
            Clear Category Validation Error
          ===================================================*/
          setValidationErrors(
            (
              currentErrors
            ) => {
              const updatedErrors = {
                ...currentErrors,
              };

              delete updatedErrors
                .budgetCategoryId;

              return updatedErrors;
            }
          );

          setIsCategoryFormOpen(
            false
          );

          setCategoryApiError('');

          return createdCategory;
        } catch (
        requestError
        ) {
          setCategoryApiError(
            requestError?.message ||
            'Unable to create category.'
          );

          return null;
        } finally {
          setCategorySubmitting(
            false
          );
        }
      },
      [
        onCreateCategory,
        setFormValues,
        setValidationErrors,
      ]
    );

  return {
    isCategoryFormOpen,
    categorySubmitting,
    categoryApiError,

    openCategoryForm,
    closeCategoryForm,
    resetCategoryForm,
    createCategory,
  };
};

export default useBillCategoryForm;