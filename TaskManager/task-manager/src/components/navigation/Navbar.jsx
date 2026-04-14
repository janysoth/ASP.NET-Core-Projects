// components/navigation/Navbar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChecklistIcon, HomeIcon, LogoutIcon, UserIcon } from '../icons/Icons';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loading } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Helper to check if route is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-indigo-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left Side - Navigation Links */}
          <div className="flex items-center gap-1">
            {/* Home Link */}
            <Link
              to="/"
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 ${isActive('/')
                ? 'bg-indigo-800 text-red-500'
                : 'hover:bg-indigo-700 text-indigo-100'
                }`}
            >
              <HomeIcon className="w-6 h-6" />
              <span className="font-semibold hidden sm:block">Home</span>
            </Link>

            {/* Todos Link */}
            <Link
              to="/todos"
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 ${isActive('/todos')
                ? 'bg-indigo-800 text-red-500'
                : 'hover:bg-indigo-700 text-indigo-100'
                }`}
            >
              <ChecklistIcon className="w-6 h-6" />
              <span className="font-semibold hidden sm:block">Todos</span>
            </Link>
          </div>

          {/* Right Side - User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 hover:bg-indigo-700 p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <UserIcon className="w-6 h-6" />
              <span className="hidden sm:block font-medium">
                {user?.fullName || user?.email || 'Profile'}
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-fade-in">

                {/* User Info Section */}
                <Link
                  to="/user-info"
                  className="block p-4 bg-gray-50 border-b border-gray-200 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {loading ? 'Loading...' : user?.fullName ?? 'User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {loading ? '' : user?.email ?? 'No email'}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  <LogoutIcon className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;