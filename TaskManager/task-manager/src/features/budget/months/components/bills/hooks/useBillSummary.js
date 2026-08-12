import {
  useMemo,
} from 'react';

/*===========================================================
  useBillSummary:
  => Calculates bill totals for the current budget month.

  Returns:
  => totalBills
  => paidBills
  => unpaidBills
  => expectedTotal
  => remainingTotal
===========================================================*/
export const useBillSummary = (
  bills = []
) => {
  return useMemo(() => {
    const paidBills =
      bills.filter(
        (bill) =>
          bill.isPaid
      );

    const unpaidBills =
      bills.filter(
        (bill) =>
          !bill.isPaid
      );

    const expectedTotal =
      bills.reduce(
        (
          total,
          bill
        ) =>
          total +
          Number(
            bill.expectedAmount ??
            0
          ),
        0
      );

    const remainingTotal =
      unpaidBills.reduce(
        (
          total,
          bill
        ) =>
          total +
          Number(
            bill.remainingAmount ??
            bill.expectedAmount ??
            0
          ),
        0
      );

    return {
      totalBills:
        bills.length,

      paidBills:
        paidBills.length,

      unpaidBills:
        unpaidBills.length,

      expectedTotal,

      remainingTotal,
    };
  }, [
    bills,
  ]);
};