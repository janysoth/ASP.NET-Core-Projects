import React from 'react';

import {
  Link,
  useLocation,
} from 'react-router-dom';

import {
  BudgetIcon,
  ChecklistIcon,
  HomeIcon,
} from '../icons/Icons';

import UserMenu from '../common/UserMenu';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname.startsWith(path);
  };

  const linkBaseClass =
    'flex items-center gap-2 rounded-lg p-2 transition-colors duration-200';

  const getLinkClass = (path) => {
    return `${linkBaseClass} ${isActive(path)
        ? 'bg-[var(--navbar-active)] text-[var(--navbar-text)]'
        : 'text-[var(--navbar-text-muted)] hover:bg-[var(--navbar-hover)] hover:text-[var(--navbar-text)]'
      }`;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--app-border)] bg-[var(--navbar-bg)] shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={getLinkClass('/')}
            >
              <HomeIcon className="h-6 w-6" />

              <span className="hidden font-semibold sm:block">
                Home
              </span>
            </Link>

            <Link
              to="/todos"
              className={getLinkClass('/todos')}
            >
              <ChecklistIcon className="h-6 w-6" />

              <span className="hidden font-semibold sm:block">
                Todos
              </span>
            </Link>

            <Link
              to="/budget"
              className={getLinkClass('/budget')}
            >
              <BudgetIcon className="h-6 w-6" />

              <span className="hidden font-semibold sm:block">
                Budget
              </span>
            </Link>
          </div>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;