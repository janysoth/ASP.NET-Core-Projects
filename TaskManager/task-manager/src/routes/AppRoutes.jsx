import { Route } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import BudgetDashboardPage from '../features/budget/dashboard/pages/BudgetDashboardPage';
import BudgetLayout from '../features/budget/layout/BudgetLayout';
import BudgetMonthDetailsPage from '../features/budget/months/pages/BudgetMonthDetailsPage';
import BudgetMonthsPage from '../features/budget/months/pages/BudgetMonthsPage';
import UserInfoPage from '../pages/auth/UserInfoPage';
import HomePage from '../pages/HomePage';
import TodosPage from '../pages/todos/TodosPage';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = (
  <Route
    element={
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    }
  >
    <Route
      path="/"
      element={<HomePage />}
    />

    <Route
      path="/todos"
      element={<TodosPage />}
    />

    <Route
      path="/user-info"
      element={<UserInfoPage />}
    />

    <Route
      path="/budget"
      element={<BudgetLayout />}
    >
      <Route
        index
        element={<BudgetDashboardPage />}
      />

      <Route
        path="months"
        element={<BudgetMonthsPage />}
      />

      <Route
        path="months/:budgetMonthId"
        element={<BudgetMonthDetailsPage />}
      />

    </Route>
  </Route>
);

export default AppRoutes;