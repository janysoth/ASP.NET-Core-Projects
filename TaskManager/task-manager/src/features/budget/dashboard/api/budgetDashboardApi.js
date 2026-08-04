import api from '../../../../services/api';

/*===========================================================
  getBudgetMonths:
  => Gets every budget month owned by the logged-in user.

  Backend:
  GET /api/budget/months
===========================================================*/
export const getBudgetMonths = async () => {
  const response =
    await api.get('budget/months');

  return response.data;
};

/*===========================================================
  getBudgetMonthById:
  => Gets one complete budget month.
  => Includes categories, income records, and expenses.

  Backend:
  GET /api/budget/months/{budgetMonthId}
===========================================================*/
export const getBudgetMonthById = async (
  budgetMonthId
) => {
  if (!budgetMonthId) {
    throw new Error(
      'Budget month ID is required.'
    );
  }

  const response =
    await api.get(
      `budget/months/${budgetMonthId}`
    );

  return response.data;
};

/*===========================================================
  getDashboardSummary:
  => Gets the dashboard summary for a calendar month.

  Backend:
  GET /api/budget/dashboard?month=8&year=2026
===========================================================*/
export const getDashboardSummary = async (
  month,
  year
) => {
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      'Month must be between 1 and 12.'
    );
  }

  if (
    !Number.isInteger(year) ||
    year < 2000
  ) {
    throw new Error(
      'Year is invalid.'
    );
  }

  const response =
    await api.get(
      'budget/dashboard',
      {
        params: {
          month,
          year,
        },
      }
    );

  return response.data;
};

/*===========================================================
  getAccounts:
  => Gets all financial accounts.

  Backend:
  GET /api/budget/accounts
===========================================================*/
export const getAccounts = async () => {
  const response =
    await api.get('budget/accounts');

  return response.data;
};

/*===========================================================
  getBills:
  => Gets bills for a selected calendar month.

  Backend:
  GET /api/budget/bills?month=8&year=2026
===========================================================*/
export const getBills = async (
  month,
  year
) => {
  const response =
    await api.get(
      'budget/bills',
      {
        params: {
          month,
          year,
        },
      }
    );

  return response.data;
};

/*===========================================================
  getTransactions:
  => Gets transactions for a selected calendar month.

  Backend:
  GET /api/budget/transactions?month=8&year=2026
===========================================================*/
export const getTransactions = async (
  month,
  year
) => {
  const response =
    await api.get(
      'budget/transactions',
      {
        params: {
          month,
          year,
        },
      }
    );

  return response.data;
};

/*===========================================================
  createBill:
  => Creates a bill inside a selected budget month.

  Backend:
  POST /api/budget/months/{budgetMonthId}/bills
===========================================================*/
export const createBill = async (
  budgetMonthId,
  billData
) => {
  if (!budgetMonthId) {
    throw new Error(
      'Budget month ID is required.'
    );
  }

  const response =
    await api.post(
      `budget/months/${budgetMonthId}/bills`,
      billData
    );

  return response.data;
};