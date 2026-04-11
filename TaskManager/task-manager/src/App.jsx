import { Routes } from 'react-router-dom';

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
    </>
  );
}

export default App;