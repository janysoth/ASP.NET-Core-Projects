import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import Avatar from './Avatar';

import { useAuth } from '../../hooks/useAuth';

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
  // Close dropdown on outside click
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

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
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
    >

      {/* =========================
          Avatar Trigger
      ========================== */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-lg p-1 hover:bg-red-400 transition"
      >

        <Avatar
          size="md"
          fullName={user?.fullName}
          profileImageUrl={profileImageUrl}
        />

        <div className="hidden sm:flex flex-col text-left">
          <span className="text-sm font-semibold text-white">
            {user?.fullName}
          </span>

          <span className="text-xs text-white">
            {user?.email}
          </span>
        </div>

      </button>

      {/* =========================
          Dropdown
      ========================== */}
      {open && (
        <div className="absolute right-0 mt-1 w-52 overflow-hidden border rounded-xl border-gray-200 bg-white shadow-xl z-50">

          {/* Menu Items */}
          <div className="py-2">

            <Link
              to="/user-info"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-200 transition"
            >
              Profile Settings
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
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