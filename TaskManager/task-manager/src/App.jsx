import { Routes } from 'react-router-dom';

import { Toaster } from 'react-hot-toast';

import SessionWarningModal from './components/modals/SessionWarningModal';
import AppRoutes from './routes/AppRoutes';
import AuthRoutes from './routes/AuthRoutes';

function App() {
  return (
    <>
      <Routes>
        {AuthRoutes}
        {AppRoutes}
      </Routes>

      <SessionWarningModal />

      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,

          style: {
            borderRadius: '10px',
            background: '#334155',
            color: '#fff',
            fontSize: '14px',
          },

          success: {
            style: {
              background: '#16a34a',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#16a34a',
            },
          },

          error: {
            style: {
              background: '#dc2626',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#dc2626',
            },
          },

          loading: {
            style: {
              background: '#2563eb',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#2563eb',
            },
          },
        }}
      />
    </>
  );
}

export default App;