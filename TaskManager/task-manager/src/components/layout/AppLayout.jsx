import { Outlet } from 'react-router-dom';

import FloatingThemeBar from '../common/FloatingThemeBar';
import Navbar from '../navigation/Navbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <Navbar />

      <main className="pt-4">
        <Outlet />
      </main>

      <FloatingThemeBar />
    </div>
  );
};

export default AppLayout;