import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAccounts,
  getBills,
  getBudgetMonths,
  getDashboardSummary,
  getTransactions,
} from '@/features/budget/api/budgetApi';

/*===========================================================
  getErrorMessage:
  => Extracts a readable API error message.
===========================================================*/
const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Unable to load the budget dashboard.'
  );
};

/*===========================================================
  sortBudgetMonths:
  => Sorts budget months newest first.
===========================================================*/
const sortBudgetMonths = (months) => {
  return [...months].sort((first, second) => {
    if (first.year !== second.year) {
      return second.year - first.year;
    }

    return second.month - first.month;
  });
};

/*===========================================================
  useBudgetDashboard:
  => Loads the data required by the dashboard.
  => Selects the newest budget month automatically.
===========================================================*/
export const useBudgetDashboard = () => {
  const [budgetMonths, setBudgetMonths] =
    useState([]);

  const [selectedBudgetMonthId, setSelectedBudgetMonthId] =
    useState('');

  const [dashboardSummary, setDashboardSummary] =
    useState(null);

  const [accounts, setAccounts] =
    useState([]);

  const [bills, setBills] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const selectedBudgetMonth =
    useMemo(() => {
      return budgetMonths.find(
        (budgetMonth) =>
          budgetMonth.id === selectedBudgetMonthId
      ) ?? null;
    }, [
      budgetMonths,
      selectedBudgetMonthId,
    ]);

  /*===========================================================
    loadBudgetMonths:
    => Loads available budget months.
    => Selects the newest month when none is selected.
  ===========================================================*/
  const loadBudgetMonths =
    useCallback(async () => {
      const months =
        await getBudgetMonths();

      const sortedMonths =
        sortBudgetMonths(months);

      setBudgetMonths(sortedMonths);

      setSelectedBudgetMonthId(
        (currentId) => {
          const selectedStillExists =
            sortedMonths.some(
              (month) =>
                month.id === currentId
            );

          if (selectedStillExists) {
            return currentId;
          }

          return sortedMonths[0]?.id ?? '';
        }
      );

      return sortedMonths;
    }, []);

  /*===========================================================
    loadDashboardData:
    => Loads all dashboard panels for one selected month.
  ===========================================================*/
  const loadDashboardData =
    useCallback(async (budgetMonth) => {
      if (!budgetMonth) {
        setDashboardSummary(null);
        setAccounts([]);
        setBills([]);
        setTransactions([]);
        return;
      }

      const {
        month,
        year,
      } = budgetMonth;

      const [
        summaryResult,
        accountsResult,
        billsResult,
        transactionsResult,
      ] =
        await Promise.all([
          getDashboardSummary(month, year),
          getAccounts(),
          getBills(month, year),
          getTransactions(month, year),
        ]);

      setDashboardSummary(summaryResult);
      setAccounts(accountsResult);
      setBills(billsResult);
      setTransactions(transactionsResult);
    }, []);

  /*===========================================================
    refreshDashboard:
    => Reloads all dashboard data.
  ===========================================================*/
  const refreshDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const months =
          await loadBudgetMonths();

        const monthToLoad =
          months.find(
            (month) =>
              month.id === selectedBudgetMonthId
          ) ?? months[0] ?? null;

        await loadDashboardData(monthToLoad);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setLoading(false);
      }
    }, [
      loadBudgetMonths,
      loadDashboardData,
      selectedBudgetMonthId,
    ]);

  /*===========================================================
    Initial load:
    => Loads months, then loads the newest month.
  ===========================================================*/
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');

        const months =
          await loadBudgetMonths();

        const firstMonth =
          months[0] ?? null;

        await loadDashboardData(firstMonth);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [
    loadBudgetMonths,
    loadDashboardData,
  ]);

  /*===========================================================
    Month change:
    => Reloads dashboard panels when the selected month changes.
  ===========================================================*/
  useEffect(() => {
    if (!selectedBudgetMonth) {
      return;
    }

    const loadSelectedMonth =
      async () => {
        try {
          setLoading(true);
          setError('');

          await loadDashboardData(
            selectedBudgetMonth
          );
        } catch (requestError) {
          setError(
            getErrorMessage(requestError)
          );
        } finally {
          setLoading(false);
        }
      };

    loadSelectedMonth();
  }, [
    selectedBudgetMonth,
    loadDashboardData,
  ]);

  return {
    budgetMonths,
    selectedBudgetMonth,
    selectedBudgetMonthId,
    setSelectedBudgetMonthId,

    dashboardSummary,
    accounts,
    bills,
    transactions,

    loading,
    error,
    refreshDashboard,
  };
};