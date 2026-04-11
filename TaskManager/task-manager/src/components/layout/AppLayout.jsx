import { Outlet } from 'react-router-dom';

import Navbar from '../navigation/Navbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;