/*===========================================================
  sortIncomeRecords:
  => Displays newest income dates first.
  => Does not mutate the original array.
===========================================================*/
export const sortIncomeRecords = (
  incomeRecords = []
) => {
  return [...incomeRecords].sort(
    (
      firstRecord,
      secondRecord
    ) => {
      const firstDate =
        new Date(
          firstRecord.incomeDate
        ).getTime();

      const secondDate =
        new Date(
          secondRecord.incomeDate
        ).getTime();

      const safeFirstDate =
        Number.isNaN(firstDate)
          ? 0
          : firstDate;

      const safeSecondDate =
        Number.isNaN(secondDate)
          ? 0
          : secondDate;

      return (
        safeSecondDate -
        safeFirstDate
      );
    }
  );
};

/*===========================================================
  sortExpenseRecords:
  => Displays newest expense dates first.
  => Does not mutate the original array.
===========================================================*/
export const sortExpenseRecords = (
  expenseRecords = []
) => {
  return [...expenseRecords].sort(
    (
      firstRecord,
      secondRecord
    ) => {
      const firstDate =
        new Date(
          firstRecord.expenseDate
        ).getTime();

      const secondDate =
        new Date(
          secondRecord.expenseDate
        ).getTime();

      const safeFirstDate =
        Number.isNaN(firstDate)
          ? 0
          : firstDate;

      const safeSecondDate =
        Number.isNaN(secondDate)
          ? 0
          : secondDate;

      return (
        safeSecondDate -
        safeFirstDate
      );
    }
  );
};

/*===========================================================
  sortBudgetCategories:
  => Sorts categories by:
     1. Main type
     2. Expense type
     3. Category name
  => Does not mutate the original array.
===========================================================*/
export const sortBudgetCategories = (
  categories = []
) => {
  const typeOrder = {
    Expense: 1,
    Savings: 2,
  };

  const expenseTypeOrder = {
    Fixed: 1,
    Variable: 2,
  };

  return [...categories].sort(
    (
      firstCategory,
      secondCategory
    ) => {
      const mainTypeDifference =
        (
          typeOrder[
          firstCategory.type
          ] ?? 99
        ) -
        (
          typeOrder[
          secondCategory.type
          ] ?? 99
        );

      if (mainTypeDifference !== 0) {
        return mainTypeDifference;
      }

      const expenseTypeDifference =
        (
          expenseTypeOrder[
          firstCategory.expenseType
          ] ?? 99
        ) -
        (
          expenseTypeOrder[
          secondCategory.expenseType
          ] ?? 99
        );

      if (
        expenseTypeDifference !== 0
      ) {
        return expenseTypeDifference;
      }

      return (
        firstCategory.name ?? ''
      ).localeCompare(
        secondCategory.name ?? ''
      );
    }
  );
};