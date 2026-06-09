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

  const backendUrl = useMemo(() => {
    return (
      process.env.REACT_APP_API_URL ||
      'http://localhost:5138'
    );
  }, []);

  const profileImageUrl = useMemo(() => {
    if (!user?.profileImageUrl) return '';
    return `${backendUrl}${user.profileImageUrl}`;
  }, [backendUrl, user?.profileImageUrl]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () =>
      document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex items-center gap-3
          rounded-lg p-2
          transition
          hover:bg-[var(--navbar-hover)]
        "
      >
        <Avatar
          size="md"
          fullName={user?.fullName}
          profileImageUrl={profileImageUrl}
        />

        <div className="hidden max-w-[160px] flex-col text-left sm:flex">
          <span className="truncate text-sm font-semibold text-[var(--navbar-text)]">
            {user?.fullName}
          </span>

          <span
            className="truncate text-xs text-[var(--navbar-text-muted)]"
            title={user?.email}
          >
            {user?.email}
          </span>
        </div>

        <svg
          className={`h-4 w-4 text-[var(--navbar-text)] transition-transform ${open ? 'rotate-180' : ''
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

      {open && (
        <div
          className="
            absolute right-0 z-50
            w-64 overflow-hidden
            rounded-xl
            border border-[var(--app-border)]
            bg-[var(--app-surface)]
            shadow-xl
          "
        >
          <div className="py-2">
            <Link
              to="/user-info"
              onClick={() => setOpen(false)}
              className="
                block px-4 py-3
                text-sm text-[var(--app-text)]
                transition
                hover:bg-[var(--app-surface-muted)]
              "
            >
              Profile Settings
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full px-4 py-3 text-left
                text-sm text-red-500
                transition
                hover:bg-red-500/10
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