// components/navigation/Navbar.jsx

import React from 'react';

import {
  Link,
  useLocation,
} from 'react-router-dom';

import {
  ChecklistIcon,
  HomeIcon,
} from '../icons/Icons';

import UserMenu from '../common/UserMenu';

const Navbar = () => {
  const location = useLocation();

  // =========================
  // Active Route Helper
  // =========================
  const isActive = (path) =>
    location.pathname === path;

  return (
    <nav className="bg-indigo-600 text-white shadow-md sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* =========================
              Left Side Navigation
          ========================== */}
          <div className="flex items-center gap-1">

            {/* Home */}
            <Link
              to="/"
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 ${isActive('/')
                  ? 'bg-indigo-800 text-red-400'
                  : 'hover:bg-indigo-700 text-indigo-100'
                }`}
            >
              <HomeIcon className="w-6 h-6" />

              <span className="hidden sm:block font-semibold">
                Home
              </span>
            </Link>

            {/* Todos */}
            <Link
              to="/todos"
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 ${isActive('/todos')
                  ? 'bg-indigo-800 text-red-400'
                  : 'hover:bg-indigo-700 text-indigo-100'
                }`}
            >
              <ChecklistIcon className="w-6 h-6" />

              <span className="hidden sm:block font-semibold">
                Todos
              </span>
            </Link>

          </div>

          {/* =========================
              Right Side User Menu
          ========================== */}
          <UserMenu />

        </div>

      </div>

    </nav>
  );
};

export default Navbar;