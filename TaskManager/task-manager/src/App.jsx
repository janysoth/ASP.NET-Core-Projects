import { Route, Routes } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import SessionWarningModal from './components/modals/SessionWarningModal';

import ProtectedRoute from './routes/ProtectedRoute';

import HomePage from './pages/HomePage';
import TodosPage from './pages/TodosPage';
import UserInfoPage from './pages/UserInfoPage';

import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <>
      <Routes>

        {/* ================= AUTH ROUTES ================= */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />

        <Route
          path="/register"
          element={
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <AuthLayout>
              <ForgotPasswordPage />
            </AuthLayout>
          }
        />

        <Route
          path="/reset-password"
          element={
            <AuthLayout>
              <ResetPasswordPage />
            </AuthLayout>
          }
        />

        {/* ================= PROTECTED APP ROUTES ================= */}
        <Route
          path="/"
          element={
            <AppLayout>
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            </AppLayout>
          }
        />

        <Route
          path="/todos"
          element={
            <AppLayout>
              <ProtectedRoute>
                <TodosPage />
              </ProtectedRoute>
            </AppLayout>
          }
        />

        <Route
          path="/user-info"
          element={
            <AppLayout>
              <ProtectedRoute>
                <UserInfoPage />
              </ProtectedRoute>
            </AppLayout>
          }
        />

      </Routes>

      <SessionWarningModal />
    </>
  );
}

export default App;