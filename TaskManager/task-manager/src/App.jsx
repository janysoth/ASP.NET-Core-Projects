import React, { useContext } from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/layout/Layout';
import SessionWarningModal from './components/modals/SessionWarningModal';
import { AuthContext } from './context/AuthContext';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TodosPage from './pages/TodosPage';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  const { showWarning } = useContext(AuthContext);

  return (
    <>
      <Layout modalOpen={showWarning}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/todos"
            element={
              <ProtectedRoute>
                <TodosPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>

      {/* Session Warning Modal */}
      <SessionWarningModal
        show={showWarning}
      />
    </>
  );
}

export default App;