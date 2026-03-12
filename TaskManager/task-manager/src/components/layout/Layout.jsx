import React from 'react';
import { useLocation } from 'react-router-dom';

import Navbar from '../navigation/Navbar';

// Routes where navbar should be hidden
const HIDDEN_ROUTES = ['/login', '/register'];

const Layout = ({ children }) => {
  const location = useLocation();
  const shouldShowNavbar = !HIDDEN_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowNavbar && <Navbar />}
      <main className={shouldShowNavbar ? 'pt-4' : ''}>
        {children}
      </main>
    </div>
  );
};

export default Layout;