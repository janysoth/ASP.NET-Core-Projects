import { Route } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import BudgetLayout from '../features/budget/layout/BudgetLayout';
import BudgetDashboardPage from '../features/budget/pages/BudgetDashboardPage';
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
    </Route>
  </Route>
);

export default AppRoutes;