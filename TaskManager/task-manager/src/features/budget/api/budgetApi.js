import api from '@/services/api';

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

/*===========================================================
  updateBill:
  => Completely updates an existing bill.

  Backend:
  PUT /api/budget/bills/{billId}
===========================================================*/
export const updateBill = async (
  billId,
  billData
) => {
  if (!billId) {
    throw new Error(
      'Bill ID is required.'
    );
  }

  const response =
    await api.put(
      `budget/bills/${billId}`,
      billData
    );

  return response.data;
};

/*===========================================================
  markBillPaid:
  => Marks an unpaid bill as paid.
  => Creates the linked ExpenseRecord on the backend.

  Backend:
  POST /api/budget/bills/{billId}/mark-paid
===========================================================*/
export const markBillPaid = async (
  billId,
  paymentData
) => {
  if (!billId) {
    throw new Error(
      'Bill ID is required.'
    );
  }

  const response =
    await api.post(
      `budget/bills/${billId}/mark-paid`,
      paymentData
    );

  return response.data;
};

/*===========================================================
  markBillUnpaid:
  => Reverses a paid bill.
  => Deletes the linked expense record.
  => Restores the bill to unpaid.

  Backend:
  POST /api/budget/bills/{billId}/mark-unpaid
===========================================================*/
export const markBillUnpaid = async (
  billId
) => {
  if (!billId) {
    throw new Error(
      'Bill ID is required.'
    );
  }

  const response =
    await api.post(
      `budget/bills/${billId}/mark-unpaid`
    );

  return response.data;
};

/*===========================================================
  createBudgetCategory:
  => Creates a category inside a selected budget month.

  Backend:
  POST /api/budget/months/{budgetMonthId}/categories
===========================================================*/
export const createBudgetCategory = async (
  budgetMonthId,
  categoryData
) => {
  if (!budgetMonthId) {
    throw new Error(
      'Budget month ID is required.'
    );
  }

  const response =
    await api.post(
      `budget/months/${budgetMonthId}/categories`,
      categoryData
    );

  return response.data;
};

/*===========================================================
  deleteBill:
  => Deletes an unpaid bill.
  => Backend rejects paid bills.
===========================================================*/
export const deleteBill = async (
  billId
) => {
  if (!billId) {
    throw new Error(
      'Bill ID is required.'
    );
  }

  const response =
    await api.delete(
      `budget/bills/${billId}`
    );

  return response.data;
};

/*===========================================================
  createIncome:
  => Creates an income record inside a selected budget month.

  Backend:
  POST /api/budget/months/{budgetMonthId}/income
===========================================================*/
export const createIncome = async (
  budgetMonthId,
  incomeData
) => {
  if (!budgetMonthId) {
    throw new Error(
      'Budget month ID is required.'
    );
  }

  const response =
    await api.post(
      `budget/months/${budgetMonthId}/income`,
      incomeData
    );

  return response.data;
};

/*===========================================================
  updateIncome:
  => Completely updates an existing income record.

  Backend:
  PUT /api/budget/income/{incomeId}
===========================================================*/
export const updateIncome = async (
  incomeId,
  incomeData
) => {
  if (!incomeId) {
    throw new Error(
      'Income ID is required.'
    );
  }

  const response =
    await api.put(
      `budget/income/${incomeId}`,
      incomeData
    );

  return response.data;
};

/*===========================================================
  deleteIncome:
  => Deletes an income record.

  Backend:
  DELETE /api/budget/income/{incomeId}
===========================================================*/
export const deleteIncome = async (
  incomeId
) => {
  if (!incomeId) {
    throw new Error(
      'Income ID is required.'
    );
  }

  const response =
    await api.delete(
      `budget/income/${incomeId}`
    );

  return response.data;
};

/*===========================================================
  createExpense:
  => Creates an expense record inside a selected budget month.

  Backend:
  POST /api/budget/months/{budgetMonthId}/expenses
===========================================================*/
export const createExpense = async (
  budgetMonthId,
  expenseData
) => {
  if (!budgetMonthId) {
    throw new Error(
      'Budget month ID is required.'
    );
  }

  const response =
    await api.post(
      `budget/months/${budgetMonthId}/expenses`,
      expenseData
    );

  return response.data;
};

/*===========================================================
  updateExpense:
  => Completely updates an existing expense record.

  Backend:
  PUT /api/budget/expenses/{expenseId}
===========================================================*/
export const updateExpense = async (
  expenseId,
  expenseData
) => {
  if (!expenseId) {
    throw new Error(
      'Expense ID is required.'
    );
  }

  const response =
    await api.put(
      `budget/expenses/${expenseId}`,
      expenseData
    );

  return response.data;
};

/*===========================================================
  deleteExpense:
  => Deletes an expense record.

  Backend:
  DELETE /api/budget/expenses/{expenseId}
===========================================================*/
export const deleteExpense = async (
  expenseId
) => {
  if (!expenseId) {
    throw new Error(
      'Expense ID is required.'
    );
  }

  const response =
    await api.delete(
      `budget/expenses/${expenseId}`
    );

  return response.data;
};

/*===========================================================
  createBudgetMonth:
  => Creates a new budget month.

  Backend:
  POST /api/budget/months
===========================================================*/
export const createBudgetMonth = async (
  budgetMonthData
) => {
  const response =
    await api.post(
      'budget/months',
      budgetMonthData
    );

  return response.data;
};

