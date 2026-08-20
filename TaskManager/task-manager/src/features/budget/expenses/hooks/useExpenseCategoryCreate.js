import {
  useCallback,
  useState,
} from 'react';

import {
  createBudgetCategory,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  showError,
  showSuccess,
} from '@/utils/toastHelpers';

/*===========================================================
  useExpenseCategoryCreate:
  => Owns quick category creation from the Expense workflow.

  Handles:
  => Category modal state.
  => Category submission.
  => Budget month refresh.
  => Newly-created category ID.

  IMPORTANT:
  => Expense modal remains open while category modal is used.
===========================================================*/
export const useExpenseCategoryCreate = ({
  budgetMonthId,
  onBudgetMonthChanged,
}) => {
  const [
    isCategoryFormOpen,
    setIsCategoryFormOpen,
  ] = useState(false);

  const [
    creatingCategory,
    setCreatingCategory,
  ] = useState(false);

  const [
    createdCategoryId,
    setCreatedCategoryId,
  ] = useState('');

  /*===========================================================
    Open Category Form
  ===========================================================*/
  const handleOpenCategoryForm =
    useCallback(() => {
      setIsCategoryFormOpen(
        true
      );
    }, []);

  /*===========================================================
    Close Category Form
  ===========================================================*/
  const handleCloseCategoryForm =
    useCallback(() => {
      if (
        creatingCategory
      ) {
        return;
      }

      setIsCategoryFormOpen(
        false
      );
    }, [
      creatingCategory,
    ]);

  /*===========================================================
    Create Category
  ===========================================================*/
  const handleCreateExpenseCategory =
    useCallback(
      async (
        categoryData
      ) => {
        if (
          !budgetMonthId
        ) {
          showError(
            'Budget month ID is required.'
          );

          return false;
        }

        try {
          setCreatingCategory(
            true
          );

          const createdCategory =
            await createBudgetCategory(
              budgetMonthId,
              categoryData
            );

          /*
            Store the new ID immediately so ExpenseForm can
            automatically select it.
          */
          if (
            createdCategory?.id
          ) {
            setCreatedCategoryId(
              createdCategory.id
            );
          }

          /*
            Refresh the parent month so the category list
            contains the newly-created category.
          */
          if (
            onBudgetMonthChanged
          ) {
            await onBudgetMonthChanged();
          }

          setIsCategoryFormOpen(
            false
          );

          showSuccess(
            'Category created successfully.'
          );

          return createdCategory;
        } catch (
        requestError
        ) {
          showError(
            getApiErrorMessage(
              requestError,
              'Unable to create category.'
            )
          );

          return false;
        } finally {
          setCreatingCategory(
            false
          );
        }
      },
      [
        budgetMonthId,
        onBudgetMonthChanged,
      ]
    );

  /*===========================================================
    Clear Created Category:
    => Useful after Expense modal closes.
  ===========================================================*/
  const clearCreatedCategory =
    useCallback(() => {
      setCreatedCategoryId('');
    }, []);

  return {
    isCategoryFormOpen,
    creatingCategory,
    createdCategoryId,

    handleOpenCategoryForm,
    handleCloseCategoryForm,
    handleCreateExpenseCategory,
    clearCreatedCategory,
  };
};