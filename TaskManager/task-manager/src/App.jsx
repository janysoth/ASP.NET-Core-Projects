import { Route, Routes } from 'react-router-dom';

import Layout from './components/layout/Layout';
import SessionWarningModal from './components/modals/SessionWarningModal';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TodosPage from './pages/TodosPage';
import ProtectedRoute from './routes/ProtectedRoute';
import UserInfoPage from './pages/UserInfoPage';

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
        </Routes>
      </Layout>

      {/* Session Warning Modal */}
      <SessionWarningModal />
    </>
  );
}

export default App;