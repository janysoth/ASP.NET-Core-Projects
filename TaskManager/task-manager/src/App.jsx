import { Route, Routes } from 'react-router-dom';

import Layout from './components/layout/Layout';
import SessionWarningModal from './components/modals/SessionWarningModal';

import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TodosPage from './pages/TodosPage';
import UserInfoPage from './pages/UserInfoPage';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
          <Route path="/user-info" element={<ProtectedRoute><UserInfoPage /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </Layout>

      {/* Session Warning Modal */}
      <SessionWarningModal />
    </>
  );
}

export default App;