/*===========================================================
  sortBills:
  => Shows unpaid bills first.
  => Sorts each paid/unpaid group by due date.
  => Does not mutate the original array.
===========================================================*/
export const sortBills = (
  bills = []
) => {
  return [...bills].sort(
    (
      firstBill,
      secondBill
    ) => {
      if (
        firstBill.isPaid !==
        secondBill.isPaid
      ) {
        return firstBill.isPaid
          ? 1
          : -1;
      }

      const firstDueDate =
        new Date(
          firstBill.dueDate
        ).getTime();

      const secondDueDate =
        new Date(
          secondBill.dueDate
        ).getTime();

      const safeFirstDueDate =
        Number.isNaN(firstDueDate)
          ? Number.MAX_SAFE_INTEGER
          : firstDueDate;

      const safeSecondDueDate =
        Number.isNaN(secondDueDate)
          ? Number.MAX_SAFE_INTEGER
          : secondDueDate;

      return (
        safeFirstDueDate -
        safeSecondDueDate
      );
    }
  );
};

/*===========================================================
  getBillStatusAppearance:
  => Provides readable bill status text and matching styles.
===========================================================*/
export const getBillStatusAppearance = (
  bill
) => {
  if (bill?.isPaid) {
    return {
      label:
        'Paid',

      className:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    };
  }

  const normalizedStatus =
    bill?.status
      ?.trim()
      .toLowerCase();

  if (
    normalizedStatus ===
    'overdue'
  ) {
    return {
      label:
        'Overdue',

      className:
        'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    };
  }

  if (
    normalizedStatus ===
    'partially paid' ||
    normalizedStatus ===
    'partial'
  ) {
    return {
      label:
        'Partially Paid',

      className:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    };
  }

  return {
    label:
      bill?.status ||
      'Upcoming',

    className:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  };
};