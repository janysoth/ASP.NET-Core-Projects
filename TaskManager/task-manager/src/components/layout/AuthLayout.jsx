import { Outlet } from 'react-router-dom';
import FloatingThemeBar from '../common/FloatingThemeBar';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <Outlet />

      <FloatingThemeBar />
    </div>
  );
};

export default AuthLayout;