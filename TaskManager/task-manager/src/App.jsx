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

      {/* ✅ GLOBAL TOAST */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 1000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;