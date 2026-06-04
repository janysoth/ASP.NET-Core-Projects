import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';

const UserMenu = () => {
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // =========================
  // Backend URL
  // =========================
  const backendUrl = useMemo(() => {
    return (
      process.env.REACT_APP_API_URL ||
      'http://localhost:5138'
    );
  }, []);

  // =========================
  // Profile Image
  // =========================
  const profileImageUrl = useMemo(() => {
    if (!user?.profileImageUrl) return '';
    return `${backendUrl}${user.profileImageUrl}`;
  }, [backendUrl, user?.profileImageUrl]);

  // =========================
  // Close on outside click
  // =========================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // =========================
  // ESC closes menu
  // =========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () =>
      document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // =========================
  // Logout
  // =========================
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
    }
  };

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* =========================
          Navbar Trigger
      ========================== */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex items-center gap-3
          rounded-lg p-2
          hover:bg-indigo-700
          transition
        "
      >
        <Avatar
          size="md"
          fullName={user?.fullName}
          profileImageUrl={profileImageUrl}
        />

        <div className="hidden sm:flex flex-col text-left max-w-[160px]">
          <span className="text-sm font-semibold text-white truncate">
            {user?.fullName}
          </span>

          <span
            className="text-xs text-indigo-100 truncate"
            title={user?.email}
          >
            {user?.email}
          </span>
        </div>

        <svg
          className={`w-4 h-4 text-white transition-transform ${open ? 'rotate-180' : ''
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* =========================
          Dropdown 
      ========================== */}
      {open && (
        <div className="
          absolute right-0
          w-64
          rounded-xl
          border border-gray-200
          bg-white
          shadow-xl
          z-50
          overflow-hidden
        ">
          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/user-info"
              onClick={() => setOpen(false)}
              className="
                block px-4 py-3
                text-sm text-gray-700
                hover:bg-indigo-50
                transition
              "
            >
              Profile Settings
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full text-left px-4 py-3
                text-sm text-red-600
                hover:bg-red-50
                transition
              "
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;